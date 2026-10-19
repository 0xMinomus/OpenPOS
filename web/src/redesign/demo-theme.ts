import { useEffect, useState } from 'react'
import type { ThemePref } from '../lib/store'

// Tema khusus sandbox /demo: hanya mengganti kelas .dark pada dokumen,
// tanpa menulis localStorage op_theme — preferensi tema aplikasi asli tak
// boleh berubah karena sandbox.
export function applyDemoTheme(pref: ThemePref) {
  document.documentElement.classList.toggle('dark', pref === 'dark')
}

// Kembalikan tampilan ke preferensi aplikasi asli (baca-saja, tanpa tulis).
export function restoreAppTheme() {
  applyDemoTheme(localStorage.getItem('op_theme') === 'dark' ? 'dark' : 'light')
}

export function useDemoTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() => (localStorage.getItem('op_theme') === 'dark' ? 'dark' : 'light'))
  useEffect(() => {
    applyDemoTheme(pref)
  }, [pref])
  return [pref, setPref]
}
