import { useEffect, useSyncExternalStore, useState } from 'react'
import type { Role, User } from './api'

export type { Role }
export type { Trx, Product, Category, Movement, StoreSettings, PayMethod } from './api'

export interface Session {
  id: string
  email: string
  name: string
  role: Role
  store: string
}

export function toSession(u: User): Session {
  return { id: u.id, email: u.email, name: u.name, role: u.role, store: u.store_name }
}

let session: Session | null = null
let version = 0
const subs = new Set<() => void>()

export function useDB(): { session: Session | null } {
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => version,
  )
  return { session }
}

export function setSession(s: Session | null) {
  session = s
  version++
  subs.forEach((cb) => cb())
}

export function getSession(): Session | null {
  return session
}

// ── theme ────────────────────────────────────────────────────────────

export type ThemePref = 'light' | 'dark'

export function applyTheme(pref: ThemePref) {
  document.documentElement.classList.toggle('dark', pref === 'dark')
  localStorage.setItem('op_theme', pref)
}

export function useTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() => {
    const saved = localStorage.getItem('op_theme')
    return saved === 'dark' ? 'dark' : 'light'
  })
  useEffect(() => {
    applyTheme(pref)
  }, [pref])
  return [pref, setPref]
}

// ── format & util ────────────────────────────────────────────────────

export function fmtRp(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export function fmtShort(n: number): string {
  if (n >= 1000000) return (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt'
  if (n >= 1000) return Math.round(n / 1000).toLocaleString('id-ID') + 'rb'
  return String(n)
}

export function fmtInv(id: string | number): string {
  const s = String(id).trim()
  return s !== '' && !isNaN(Number(s)) ? `#TRX-${String(Math.trunc(Number(s))).padStart(5, '0')}` : `#${s}`
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function downloadBlob(filename: string, blob: Blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  downloadBlob(filename, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
}

export interface ExcelSheet {
  name: string
  rows: string[][]
}

// Nama sheet Excel: maks 31 karakter, tanpa \ / : * ? [ ].
function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/:*?[\]]/g, ' ').trim().slice(0, 31) || 'Sheet1'
}

// Lebar kolom otomatis dari isi sel (didukung penuh oleh writer SheetJS).
function autoWidths(rows: string[][]): { wch: number }[] {
  if (rows.length === 0) return []
  const n = Math.max(...rows.map((r) => r.length))
  const widths = new Array<number>(n).fill(10)
  for (const r of rows) {
    r.forEach((c, i) => {
      const len = [...String(c ?? '')].length
      if (len > widths[i]!) widths[i] = len
    })
  }
  return widths.map((w) => ({ wch: Math.min(Math.max(w + 2, 10), 50) }))
}

// Export Excel (.xlsx). sheets = 1 sheet per entri — untuk laporan multi-tab,
// kirim semua tab sekaligus agar jadi 1 workbook. xlsx di-import lazy supaya
// bundle awal tetap ringan (dipakai hanya saat export/import).
// ponytail: tanpa styling sel (SheetJS CE tak dukung) — kerapian dari header +
// lebar kolom otomatis; ganti exceljs bila butuh bold/warna.
export async function exportExcel(filename: string, sheets: ExcelSheet[]) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows)
    ws['!cols'] = autoWidths(s.rows)
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(s.name))
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
}

// Parse file import (CSV atau XLSX) jadi matriks string; baris 0 = header.
// XLSX.read dipakai juga untuk CSV agar koma dalam kutip ditangani benar
// (parser split(',') lama pecah di kasus itu). Baris kosong dibuang.
export async function parseImportFile(f: File): Promise<string[][]> {
  const XLSX = await import('xlsx')
  const isXlsx = /\.(xlsx|xls)$/i.test(f.name)
  const wb = isXlsx
    ? XLSX.read(await f.arrayBuffer(), { type: 'array' })
    : XLSX.read(await f.text(), { type: 'string' })
  const ws = wb.Sheets[wb.SheetNames[0]!]
  if (!ws) return []
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false })
  return aoa
    .map((r) => (Array.isArray(r) ? r : [r]).map((c) => String(c ?? '').trim()))
    .filter((r) => r.some((c) => c !== ''))
}