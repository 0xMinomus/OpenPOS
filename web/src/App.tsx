import type { ReactNode } from 'react'
import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorBoundary from './lib/ErrorBoundary'
import { useDB } from './lib/store'
import { useDemoDB } from './redesign/demo-session'
// Jalur auth tetap eager: halaman ini harus tampil secepat mungkin, dan tidak
// ikut menyeret Recharts + halaman /app ke unduhan pertama.
import Landing from './pages/Landing'
import Masuk from './pages/Masuk'
import Daftar from './pages/Daftar'
import AppShell from './pages/AppShell'

// Sisanya dipecah per rute: satu chunk per halaman, diunduh saat dibuka saja.
const PilihAkun = lazy(() => import('./pages/PilihAkun'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Karyawan = lazy(() => import('./pages/Karyawan'))
const Pos = lazy(() => import('./pages/Pos'))
const Produk = lazy(() => import('./pages/Produk'))
const Stok = lazy(() => import('./pages/Stok'))
const Transaksi = lazy(() => import('./pages/Transaksi'))
const Laporan = lazy(() => import('./pages/Laporan'))
const Users = lazy(() => import('./pages/Users'))
const Pengaturan = lazy(() => import('./pages/Pengaturan'))
const Unduh = lazy(() => import('./pages/Unduh'))
const RedesignShell = lazy(() => import('./redesign/RedesignShell'))
const RedesignDashboard = lazy(() => import('./redesign/Dashboard'))
const RedesignPos = lazy(() => import('./redesign/Pos'))
const RedesignProduk = lazy(() => import('./redesign/Produk'))
const RedesignStok = lazy(() => import('./redesign/Stok'))
const RedesignTransaksi = lazy(() => import('./redesign/Transaksi'))
const RedesignLaporan = lazy(() => import('./redesign/Laporan'))
const RedesignKaryawan = lazy(() => import('./redesign/Karyawan'))
const RedesignUsers = lazy(() => import('./redesign/Users'))
const RedesignPengaturan = lazy(() => import('./redesign/Pengaturan'))

// Fallback rute lazy: netral dan ringan, muncul sekejap sambil chunk halaman
// diunduh (skeleton asli tiap halaman tetap dipakai setelah komponennya siap).
function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm opacity-60">
      Memuat…
    </div>
  )
}

// Halaman khusus admin: kasir yang mengetik URL langsung diarahkan balik.
// API tetap penjaga utama (403); ini pertahanan berlapis + UX.
function AdminOnly({ children }: { children: ReactNode }) {
  const { session } = useDB()
  if (session && session.role !== 'admin') return <Navigate to="/app" replace />
  return <>{children}</>
}

// Penjaga rute sandbox: memakai sesi demo, bukan sesi aplikasi, supaya /demo
// tak pernah melempar/mengambil pengguna ke/dari /app.
function DemoAdminOnly({ children }: { children: ReactNode }) {
  const { session } = useDemoDB()
  if (session && session.role !== 'admin') return <Navigate to="/demo" replace />
  return <>{children}</>
}

// Route lama /redesign pindah ke /demo (subpath dipertahankan).
function DemoMoved() {
  const loc = useLocation()
  return <Navigate to={loc.pathname.replace(/^\/redesign/, '/demo') + loc.search} replace />
}

// Setiap pindah route mulai dari paling atas halaman,
// bukan posisi scroll terakhir (berlaku /masuk, /daftar,
// /unduh, dan semua route lain; scroll section landing yang
// dipicu setelah navigasi tetap jalan karena dieksekusi belakangan).
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    } catch {
      window.scrollTo(0, 0)
    }
  }, [pathname])
  return null
}

export default function App() {
  return (
    <TooltipProvider>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
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
        <Route path="/demo" element={<RedesignShell />}>
          <Route index element={<RedesignDashboard />} />
          <Route path="pos" element={<RedesignPos />} />
          <Route path="produk" element={<DemoAdminOnly><RedesignProduk /></DemoAdminOnly>} />
          <Route path="stok" element={<DemoAdminOnly><RedesignStok /></DemoAdminOnly>} />
          <Route path="transaksi" element={<RedesignTransaksi />} />
          <Route path="laporan" element={<DemoAdminOnly><RedesignLaporan /></DemoAdminOnly>} />
          <Route path="karyawan" element={<DemoAdminOnly><RedesignKaryawan /></DemoAdminOnly>} />
          <Route path="users" element={<DemoAdminOnly><RedesignUsers /></DemoAdminOnly>} />
          <Route path="pengaturan" element={<DemoAdminOnly><RedesignPengaturan /></DemoAdminOnly>} />
        </Route>
        <Route path="/redesign/*" element={<DemoMoved />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </TooltipProvider>
  )
}
