import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    // Hanya index.html. offline.html dibangun terpisah (vite.offline.config.ts);
    // kalau ikut di sini, rollup menautkan kedua graf jadi satu chunk bersama
    // dan index.html ikut memuat chunk milik aplikasi offline (Recharts ~780 kB
    // saat itu).
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'index.html'),
    },
  },
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
})
