import { Link } from 'react-router'
import { Logo } from '../lib/ui'

export default function Footer() {
  return (
    <footer className="border-t border-border py-14 text-[13px] text-muted">
      <div className="container mx-auto grid max-w-6xl items-start gap-8 px-5 md:px-8 md:grid-cols-[2fr_1fr_1fr] md:gap-14">
        <div>
          <Link to="/" className="mb-3 inline-block">
            <Logo tone="light" className="h-7 w-auto" />
          </Link>
          <p className="max-w-xs leading-relaxed">
            Sistem kasir digital untuk UMKM Indonesia. Kelola produk, stok, dan penjualan dari satu dashboard sederhana.
          </p>
        </div>
        <nav className="flex flex-col gap-2.5" aria-label="Navigasi footer">
          <Link to="/masuk" className="text-sm hover:text-jet">Masuk</Link>
          <Link to="/daftar" className="text-sm hover:text-jet">Buat akun gratis</Link>
          <a href="#fitur" className="text-sm hover:text-jet">Fitur</a>
          <a href="#tentang" className="text-sm hover:text-jet">Tentang</a>
        </nav>
        <div className="flex flex-col gap-1.5 text-right md:items-end">
          <span className="font-mono text-xs">© 2026 OpenPOS</span>
          <span className="font-mono text-xs">gratis selamanya · untuk UMKM</span>
        </div>
      </div>
    </footer>
  )
}
