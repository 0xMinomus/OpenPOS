import { invoke } from '@tauri-apps/api/core'

export function installTauriBridge(): void {
  if (!('__TAURI_INTERNALS__' in window)) return
  if (window.offline) return

  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })
  window.offline = {
    isElectron: false,
    close: () => {
      void invoke('close_window')
    },
    saveFile: async (filename: string, data: ArrayBuffer): Promise<{ saved: boolean; path?: string }> => {
      try {
        return await invoke<{ saved: boolean; path?: string }>('save_file', new Uint8Array(data), {
          headers: { 'x-filename': encodeURIComponent(filename) },
        })
      } catch {
        return { saved: false }
      }
    },
  }
}

installTauriBridge()
