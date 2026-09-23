/// <reference types="vite/client" />

interface Window {
  offline?: {
    isElectron: boolean
    close: () => void
    saveFile: (filename: string, data: ArrayBuffer) => Promise<{ saved: boolean; path?: string }>
  }
}
