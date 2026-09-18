import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorBoundary from './lib/ErrorBoundary'
import { useDB } from './lib/store'
import Landing from './pages/Landing'
import Masuk from './pages/Masuk'
import Daftar from './pages/Daftar'
import PilihAkun from './pages/PilihAkun'
import AppShell from './pages/AppShell'
import Dashboard from './pages/Dashboard'
import Karyawan from './pages/Karyawan'
import Pos from './pages/Pos'
import Produk from './pages/Produk'
import Stok from './pages/Stok'
import Transaksi from './pages/Transaksi'
import Laporan from './pages/Laporan'
import Users from './pages/Users'
import Pengaturan from './pages/Pengaturan'
import Unduh from './pages/Unduh'
import RedesignShell from './redesign/RedesignShell'
import RedesignDashboard from './redesign/Dashboard'
import RedesignPos from './redesign/Pos'
import RedesignProduk from './redesign/Produk'
import RedesignStok from './redesign/Stok'
import RedesignTransaksi from './redesign/Transaksi'
import RedesignLaporan from './redesign/Laporan'
import RedesignKaryawan from './redesign/Karyawan'
import RedesignUsers from './redesign/Users'
import RedesignPengaturan from './redesign/Pengaturan'

// Halaman khusus admin: kasir yang mengetik URL langsung diarahkan balik.
// API tetap penjaga utama (403); ini pertahanan berlapis + UX.
function AdminOnly({ children }: { children: ReactNode }) {
  const { session } = useDB()
  if (session && session.role !== 'admin') return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <TooltipProvider>
      <ErrorBoundary>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/pilih-akun" element={<PilihAkun />} />
        <Route path="/unduh" element={<Unduh />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<Pos />} />
          <Route path="produk" element={<AdminOnly><Produk /></AdminOnly>} />
          <Route path="stok" element={<AdminOnly><Stok /></AdminOnly>} />
          <Route path="transaksi" element={<Transaksi />} />
          <Route path="laporan" element={<AdminOnly><Laporan /></AdminOnly>} />
          <Route path="karyawan" element={<AdminOnly><Karyawan /></AdminOnly>} />
          <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
          <Route path="pengaturan" element={<AdminOnly><Pengaturan /></AdminOnly>} />
        </Route>
        {/* Sandbox redesign tersembunyi: tanpa link/nav, noindex, data mock. */}
        <Route path="/redesign" element={<RedesignShell />}>
          <Route index element={<RedesignDashboard />} />
          <Route path="pos" element={<RedesignPos />} />
          <Route path="produk" element={<AdminOnly><RedesignProduk /></AdminOnly>} />
          <Route path="stok" element={<AdminOnly><RedesignStok /></AdminOnly>} />
          <Route path="transaksi" element={<RedesignTransaksi />} />
          <Route path="laporan" element={<AdminOnly><RedesignLaporan /></AdminOnly>} />
          <Route path="karyawan" element={<AdminOnly><RedesignKaryawan /></AdminOnly>} />
          <Route path="users" element={<AdminOnly><RedesignUsers /></AdminOnly>} />
          <Route path="pengaturan" element={<AdminOnly><RedesignPengaturan /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </TooltipProvider>
  )
}