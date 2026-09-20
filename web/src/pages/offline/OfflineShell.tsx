import { useEffect, useState, type ComponentType } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Archive, BarChart3, Boxes, LayoutDashboard, Moon, Package, PanelLeftClose, PanelLeftOpen, ReceiptText, Settings, Store, Sun } from 'lucide-react'
import '../../redesign/classic.css'
import { createAccount, hasAccount, useLocalDB } from '../../lib/localdb'
import { setSession, useDB, useTheme } from '../../lib/store'
import { Button, Input, Logo } from '../../lib/ui'

const MENU: { label: string; to: string; icon: ComponentType<{ className?: string }>; group: 'UTAMA' | 'MANAJEMEN' | 'PENGATURAN' }[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, group: 'UTAMA' },
  { label: 'POS Kasir', to: '/pos', icon: Store, group: 'UTAMA' },
  { label: 'Produk', to: '/produk', icon: Package, group: 'MANAJEMEN' },
  { label: 'Stok', to: '/stok', icon: Boxes, group: 'MANAJEMEN' },
  { label: 'Transaksi', to: '/transaksi', icon: ReceiptText, group: 'MANAJEMEN' },
  { label: 'Laporan', to: '/laporan', icon: BarChart3, group: 'MANAJEMEN' },
  { label: 'Pengaturan', to: '/pengaturan', icon: Settings, group: 'PENGATURAN' },
  { label: 'Backup', to: '/backup', icon: Archive, group: 'PENGATURAN' },
]

const GROUP_ORDER = ['UTAMA', 'MANAJEMEN', 'PENGATURAN'] as const

function isMenuActive(pathname: string, to: string) {
  return pathname === to || (to !== '/' && pathname.startsWith(to))
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export default function OfflineShell() {
  const db = useLocalDB()
  const { session } = useDB()
  const [theme, setTheme] = useTheme()
  const loc = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Drawer mobile: tutup otomatis tiap pindah halaman.
  useEffect(() => { setNavOpen(false) }, [loc.pathname])

  useEffect(() => {
    if (!hasAccount()) {
      if (session) setSession(null)
      return
    }
    const need = !session || session.id !== 'local'
      || session.name !== db.settings.ownerName || session.store !== db.settings.storeName
    if (need) {
      setSession({
        id: 'local', email: '', name: db.settings.ownerName, role: 'admin', store: db.settings.storeName,
      })
    }
  }, [db.settings.ownerName, db.settings.storeName, session])

  if (!hasAccount()) return <Onboarding />

  // Ikon toggle mengikuti status: tertutup→buka, terbuka→tutup.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  const navExpanded = narrow ? navOpen : !collapsed

  return (
    <div className={`opc-shell op-classic${navOpen ? ' nav-open' : ''}${collapsed ? ' nav-collapsed' : ''}`}>
      <div className="opc-toprow">
        <Link to="/" className="opc-brand" aria-label="Dashboard">
          <Logo tone="dark" className="h-[26px] w-auto shrink-0" />
          <span>{db.settings.storeName || 'Toko Saya'}</span>
        </Link>
        <header className="opc-topbar">
          <button
            className="opc-iconbtn"
            onClick={() => {
              if (window.innerWidth < 768) setNavOpen((v) => !v)
              else setCollapsed((v) => !v)
            }}
            aria-label="Buka/tutup navigasi"
            aria-expanded={navExpanded}
          >
            <span key={navExpanded ? 'open' : 'closed'} className="opc-icopop">
              {navExpanded ? <PanelLeftClose className="size-5" strokeWidth={1.5} /> : <PanelLeftOpen className="size-5" strokeWidth={1.5} />}
            </span>
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
            title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
            className="opc-iconbtn"
          >
            {theme === 'dark' ? <Sun className="size-5" strokeWidth={1.5} /> : <Moon className="size-5" strokeWidth={1.5} />}
          </button>
          <div className="ml-auto flex items-center">
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">Mode offline · data di perangkat</span>
          </div>
        </header>
      </div>

      <div className="opc-body">
        <aside className="opc-sidebar" aria-label="Navigasi utama">
          <nav className="opc-nav">
            {GROUP_ORDER.map((g) => {
              const items = MENU.filter((m) => m.group === g)
              if (items.length === 0) return null
              return (
                <div key={g}>
                  <p className="opc-group-label">{g}</p>
                  <ul>
                    {items.map((m) => {
                      const active = isMenuActive(loc.pathname, m.to)
                      return (
                        <li key={m.to}>
                          <Link to={m.to} aria-current={active ? 'page' : undefined} className={`opc-link${active ? ' active' : ''}`}>
                            <m.icon className="" />
                            <span>{m.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </nav>
          <div className="opc-sidefoot">
            <div className="opc-sideuser" aria-label="Pemilik toko">
              <span className="opc-avatar opc-avatar-initials" aria-hidden="true">
                {initials(db.settings.ownerName || '?')}
              </span>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium text-white">{db.settings.ownerName || '—'}</span>
                <small className="truncate">Pemilik toko</small>
              </span>
            </div>
          </div>
        </aside>
        <div className="opc-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />

        <main className="opc-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Onboarding() {
  const db = useLocalDB()
  const [ownerName, setOwnerName] = useState(() => db.settings.ownerName)
  const [storeName, setStoreName] = useState(() => db.settings.storeName)
  const [err, setErr] = useState('')

  useEffect(() => {
    // WebView2 kadang tak memberi fokus pada jendela baru/ulang — paksa fokus
    // agar input langsung bisa diketik tanpa klik ulang.
    window.focus()
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ownerName.trim() || !storeName.trim()) return setErr('Nama pemilik dan nama toko wajib diisi.')
    createAccount(ownerName.trim(), storeName.trim())
    setSession({ id: 'local', email: '', name: ownerName.trim(), role: 'admin', store: storeName.trim() })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-10 w-auto" />
        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Selamat datang di OpenPOS</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {db.settings.ownerName
              ? `Akun "${db.settings.ownerName}" ada di perangkat ini — lanjutkan untuk masuk.`
              : 'Buat akun lokal untuk mulai. Semua data tersimpan di perangkat ini.'}
          </p>
          {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-[13px] text-destructive">{err}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input label="Nama pemilik" value={ownerName} onChange={setOwnerName} placeholder="cth: Andika" required />
            <Input label="Nama toko" value={storeName} onChange={setStoreName} placeholder="cth: Toko Kelontong Serba Ada" required />
            <Button type="submit" className="w-full">Masuk</Button>
          </form>
        </div>
        <p className="mt-4 text-center text-[13px] text-muted-foreground">OpenPOS · tanpa internet, data di perangkat.</p>
      </div>
    </div>
  )
}
