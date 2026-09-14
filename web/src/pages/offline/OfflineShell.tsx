import { useEffect, useState, type ComponentType } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { LayoutDashboard, Store, Package, Boxes, ReceiptText, BarChart3, Settings, Archive } from 'lucide-react'
import { useLocalDB, createAccount, hasAccount } from '../../lib/localdb'
import { setSession, useDB, useTheme } from '../../lib/store'
import { Button, Input, Logo } from '../../lib/ui'
import { Sun, Moon } from 'lucide-react'

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

export default function OfflineShell() {
  const db = useLocalDB()
  const { session } = useDB()
  const [theme, setTheme] = useTheme()
  const loc = useLocation()

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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-12 items-center gap-2.5 px-4 pt-4">
          <Logo className="h-8 w-auto shrink-0" />
          <span className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">{db.settings.storeName || 'Toko Saya'}</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4" aria-label="Navigasi utama">
          {GROUP_ORDER.map((g) => (
            <div key={g}>
              <p className="mb-2 flex items-center gap-2.5 px-3 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {g}
                {g !== 'UTAMA' && <span aria-hidden="true" className="h-px flex-1 bg-sidebar-border" />}
              </p>
              <ul className="flex flex-col gap-1">
                {MENU.filter((m) => m.group === g).map((m) => {
                  const active = isMenuActive(loc.pathname, m.to)
                  return (
                    <li key={m.to}>
                      <Link
                        to={m.to}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${active
                          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                      >
                        {active && (
                          <span aria-hidden="true" className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--t-jet)]" />
                        )}
                        <m.icon className="size-[18px] shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="px-4 pb-4">
          <div className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-background p-2.5 text-left text-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground" aria-hidden="true">
              {(db.settings.ownerName || '?').charAt(0).toUpperCase()}
            </span>
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate font-medium text-sidebar-foreground">{db.settings.ownerName || '—'}</span>
              <span className="truncate text-xs text-muted-foreground">Pemilik toko</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{db.settings.storeName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">Mode offline · data di perangkat</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {window.offline?.isElectron ? (
              <button onClick={() => window.offline?.close()} className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                Tutup Aplikasi
              </button>
            ) : (
              <Link to="/" className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">Keluar</Link>
            )}
          </div>
        </header>
        <main className="w-full min-w-0 flex-1 space-y-4 overflow-x-clip p-4 sm:space-y-6 lg:p-6">
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
