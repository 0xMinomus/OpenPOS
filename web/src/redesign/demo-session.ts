// Sesi khusus sandbox /demo — terpisah total dari sesi aplikasi (lib/store).
// Masuk/keluar/ganti akun di sandbox tak pernah menyentuh sesi, token, atau
// cache akun aplikasi asli; /app dan /demo jalan sendiri-sendiri.
import { useSyncExternalStore } from 'react'
import type { Session } from '../lib/store'

// Akun mock sandbox (id sentinel, bukan akun backend).
export const MOCK_ADMIN: Session = {
  id: 'preview-admin',
  email: 'owner@tokopreview.id',
  name: 'Pemilik Preview',
  role: 'admin',
  store: 'Toko Preview',
}

let session: Session | null = null
let version = 0
const subs = new Set<() => void>()

export function getDemoSession(): Session | null {
  return session
}

export function setDemoSession(s: Session | null) {
  session = s
  version++
  subs.forEach((cb) => cb())
}

// Bentuk kembalian disamakan dengan useDB() lib/store agar halaman salinan
// sandbox cukup menukar import tanpa mengubah isi komponen.
export function useDemoDB(): { session: Session | null } {
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => version,
  )
  return { session }
}
