import { rm } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const outDir = 'dist-offline'

// Buang openpos.apk dari output offline: tanpa ini tiap rilis ikut
// membawa APK versi sebelumnya sehingga bundle & installer terus membengkak.
function dropPreviousApk(): Plugin {
  return {
    name: 'drop-previous-apk',
    apply: 'build',
    closeBundle() {
      return rm(path.resolve(import.meta.dirname, outDir, 'openpos.apk'), {
        force: true,
      })
    },
  }
}

// Build khusus aplikasi offline untuk Electron: base relatif agar
// jalan dari file:// (loadFile), output di dist-offline/.
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
      input: path.resolve(import.meta.dirname, 'offline.html'),
    },
  },
})
