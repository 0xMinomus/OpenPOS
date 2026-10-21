import { rm } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const outDir = 'dist-lite'

function dropPreviousApk(): Plugin {
  return {
    name: 'drop-previous-apk-lite',
    apply: 'build',
    closeBundle() {
      return rm(path.resolve(import.meta.dirname, outDir, 'openpos.apk'), {
        force: true,
      })
    },
  }
}

// Build khusus OpenPOS Lite (Tauri): entry terpisah, aset relatif.
export default defineConfig({
  plugins: [react(), tailwindcss(), dropPreviousApk()],
  base: './',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'offline-lite.html'),
    },
  },
})
