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

export type ExcelAlign = 'left' | 'center' | 'right'

export interface ExcelColumn {
  header: string
  width?: number
  align?: ExcelAlign
  money?: boolean
  percent?: boolean
}

export interface ExcelSheet {
  name: string
  title: string
  subtitle?: string
  columns: ExcelColumn[]
  rows: (string | number)[][]
  /** indeks kolom angka yg diberi baris TOTAL (SUM) */
  sumCols?: number[]
}

// Nama sheet Excel: maks 31 karakter, tanpa \ / : * ? [ ].
function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/:*?[\]]/g, ' ').trim().slice(0, 31) || 'Sheet1'
}

// Palet sejalan tema terang aplikasi (lihat index.css).
const X_INK = 'FF202C3B'
const X_TEXT = 'FF1A1A1A'
const X_MUTED = 'FF57534A'
const X_BAND = 'FFFAF6EF'
const X_LINE = 'FFDDD3C2'
const X_WHITE = 'FFFFFFFF'

function colLetter(i: number): string {
  let s = ''
  let n = i
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

// Export Excel (.xlsx) yg rapi: judul + subjudul + stamp waktu, header gelap,
// baris belang, border tipis, kolom Rp numerik, baris TOTAL otomatis, freeze
// header, filter, dan siap cetak landscape. exceljs di-import lazy supaya
// bundle awal tetap ringan (chunk terpisah, dimuat hanya saat export).
// (xlsx tetap dipakai untuk import — lihat parseImportFile.)
export async function exportExcel(filename: string, sheets: ExcelSheet[]) {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'OpenPOS'
  wb.created = new Date()
  const stamp = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const thin = { style: 'thin', color: { argb: X_LINE } } as const

  for (const s of sheets) {
    const n = s.columns.length
    if (n === 0) continue
    const ws = wb.addWorksheet(sanitizeSheetName(s.name))
    const lastCol = colLetter(n - 1)

    ws.mergeCells(`A1:${lastCol}1`)
    const title = ws.getCell('A1')
    title.value = s.title
    title.font = { size: 14, bold: true, color: { argb: X_INK } }
    ws.getRow(1).height = 24

    ws.mergeCells(`A2:${lastCol}2`)
    const sub = ws.getCell('A2')
    sub.value = [s.subtitle, `Dibuat ${stamp}`].filter(Boolean).join(' · ')
    sub.font = { size: 10, italic: true, color: { argb: X_MUTED } }
    ws.getRow(2).height = 16
    ws.getRow(3).height = 8

    const HEADER = 4
    const headerRow = ws.getRow(HEADER)
    headerRow.height = 22
    s.columns.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = c.header
      cell.font = { bold: true, size: 11, color: { argb: X_WHITE } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_INK } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = { top: thin, left: thin, right: thin, bottom: thin }
    })

    const firstData = HEADER + 1
    s.rows.forEach((r, ri) => {
      const row = ws.getRow(firstData + ri)
      row.height = 19
      const band = ri % 2 === 1
      r.forEach((v, i) => {
        const col = s.columns[i]!
        const cell = row.getCell(i + 1)
        cell.value = v
        if (col.money) cell.numFmt = '#,##0'
        else if (col.percent) cell.numFmt = '0"%"'
        cell.font = { size: 11, color: { argb: X_TEXT } }
        if (band) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_BAND } }
        cell.alignment = { horizontal: col.align ?? (typeof v === 'number' ? 'right' : 'left'), vertical: 'middle' }
        cell.border = { top: thin, left: thin, right: thin, bottom: thin }
      })
    })

    const lastData = firstData + s.rows.length - 1
    if (s.rows.length > 0 && s.sumCols && s.sumCols.length > 0) {
      const row = ws.getRow(lastData + 1)
      row.height = 20
      const label = row.getCell(1)
      label.value = 'TOTAL'
      label.font = { bold: true, size: 11, color: { argb: X_INK } }
      label.alignment = { horizontal: 'left', vertical: 'middle' }
      for (const i of s.sumCols) {
        const col = s.columns[i]
        if (!col) continue
        const cell = row.getCell(i + 1)
        const L = colLetter(i)
        cell.value = { formula: `SUM(${L}${firstData}:${L}${lastData})` }
        if (col.money) cell.numFmt = '#,##0'
        else if (col.percent) cell.numFmt = '0"%"'
        cell.font = { bold: true, size: 11, color: { argb: X_INK } }
        cell.alignment = { horizontal: col.align ?? 'right', vertical: 'middle' }
      }
      for (let i = 1; i <= n; i++) {
        const cell = row.getCell(i)
        cell.border = { ...cell.border, top: { style: 'double', color: { argb: X_INK } } }
      }
    }

    ws.columns = s.columns.map((c, i) => {
      let w = c.width ?? 0
      for (const t of [c.header, ...s.rows.map((r) => String(r[i] ?? ''))]) {
        w = Math.max(w, [...t].length)
      }
      if (c.money || c.percent) w = Math.max(w, 14)
      return { width: Math.min(Math.max(w + 3, 12), 42) }
    })

    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: HEADER }]
    ws.autoFilter = { from: { row: HEADER, column: 1 }, to: { row: HEADER, column: n } }
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  }
  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
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