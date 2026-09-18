import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard, Store, Package, Boxes, ReceiptText, BarChart3, Users, Settings, IdCard,
  Moon, Sun, LogOut, Check, UserRound, Menu, ChevronDown,
} from 'lucide-react'
import './classic.css'
import { ApiError, apiHeartbeat, apiListUsers, apiLogout, apiSwitchAccount, getCachedAccounts, resetSandbox, setCachedAccounts, type User } from './mock-api'
import { getSession, setSession, toSession, useDB, useTheme } from '../lib/store'
import { NotifBell } from './notifications'
import { Logo } from '../lib/ui'

const MENU: { label: string; to: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
  { label: 'Dashboard', to: '/redesign', icon: LayoutDashboard },
  { label: 'POS Kasir', to: '/redesign/pos', icon: Store },
  { label: 'Produk', to: '/redesign/produk', icon: Package, adminOnly: true },
  { label: 'Stok', to: '/redesign/stok', icon: Boxes, adminOnly: true },
  { label: 'Transaksi', to: '/redesign/transaksi', icon: ReceiptText },
  { label: 'Laporan', to: '/redesign/laporan', icon: BarChart3, adminOnly: true },
  { label: 'Karyawan', to: '/redesign/karyawan', icon: IdCard, adminOnly: true },
  { label: 'User Management', to: '/redesign/users', icon: Users, adminOnly: true },
  { label: 'Pengaturan', to: '/redesign/pengaturan', icon: Settings, adminOnly: true },
]

// Pengelompokan visual sidebar (admin). Murni tampilan — rute & permission tak berubah.
const GROUP_OF: Record<string, 'UTAMA' | 'MANAJEMEN' | 'PENGATURAN'> = {
  '/redesign': 'UTAMA',
  '/redesign/pos': 'UTAMA',
  '/redesign/produk': 'MANAJEMEN',
  '/redesign/stok': 'MANAJEMEN',
  '/redesign/transaksi': 'MANAJEMEN',
  '/redesign/laporan': 'MANAJEMEN',
  '/redesign/karyawan': 'PENGATURAN',
  '/redesign/users': 'PENGATURAN',
  '/redesign/pengaturan': 'PENGATURAN',
}
const GROUP_ORDER = ['UTAMA', 'MANAJEMEN', 'PENGATURAN'] as const

function isMenuActive(pathname: string, to: string) {
  return pathname === to || (to !== '/redesign' && pathname.startsWith(to))
}

// Sandbox redesign: sesi mock seeded lokal, tak menyentuh backend/token asli.
// Keluar dari /redesign mengembalikan setSession(null) saat unmount agar
// sesi mock tak bocor ke /app.
const MOCK_ADMIN = { id: 'preview-admin', email: 'owner@tokopreview.id', name: 'Pemilik Preview', role: 'admin' as const, store: 'Toko Preview' }

export default function RedesignShell() {
  const db = useDB()
  const loc = useLocation()
  const [theme, setTheme] = useTheme()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const s = db.session

  useEffect(() => {
    if (!getSession()) setSession(MOCK_ADMIN)
  }, [s])

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      meta.remove()
      // Bersih-bersih sesi mock saat tinggalkan sandbox.
      setSession(null)
    }
  }, [])

  // Heartbeat mock (noop) — struktur disamakan AppShell agar diff migrasi kecil.
  useEffect(() => {
    if (!s) return
    apiHeartbeat()
    const timer = setInterval(apiHeartbeat, 30_000)
    return () => clearInterval(timer)
  }, [s?.id, s?.role])

  // Tutup drawer tiap pindah halaman (mobile).
  useEffect(() => {
    setNavOpen(false)
  }, [loc.pathname])

  if (!s) {
    return (
      <main className="op-classic grid min-h-screen place-items-center bg-bg px-4 text-fg">
        <section className="w-full max-w-sm rounded-md border border-dove bg-paper p-8 text-center shadow-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-steel">Redesign sandbox</p>
          <h1 className="mt-3 tracking-tight text-jet">Toko Preview</h1>
          <p className="mt-2 text-sm text-muted">Mock session. No backend calls.</p>
          <button
            onClick={() => setSession(MOCK_ADMIN)}
            className="mt-6 w-full rounded-md bg-jet py-3 text-[15px] font-medium text-paper hover:opacity-85"
          >
            Masuk sandbox
          </button>
          <button
            onClick={() => { resetSandbox(); setSession({ ...MOCK_ADMIN }) }}
            className="mt-2 w-full rounded-md border border-dove py-3 text-[15px] font-medium text-jet hover:border-jet"
          >
            Reset data mock
          </button>
        </section>
      </main>
    )
  }

  const menu = MENU.filter((m) => !m.adminOnly || s.role === 'admin')

  return (
    <div className={`opc-shell op-classic${navOpen ? ' nav-open' : ''}${collapsed ? ' nav-collapsed' : ''}`}>
      <div className="opc-toprow">
        <Link to="/redesign" className="opc-brand" aria-label="Toko Preview — Dashboard">
          <Logo tone="dark" className="h-[26px] w-auto shrink-0" />
          <span>{s.store || 'Toko Preview'}</span>
        </Link>
        <header className="opc-topbar">
          <button
            className="opc-iconbtn"
            onClick={() => {
              if (window.innerWidth < 768) setNavOpen((v) => !v)
              else setCollapsed((v) => !v)
            }}
            aria-label="Buka/tutup navigasi"
            aria-expanded={navOpen}
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
            title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
            className="opc-iconbtn"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <span className="opc-bell">
              <NotifBell />
            </span>
            <span className="opc-topbar-user" aria-label={`${s.name}, ${s.role === 'admin' ? 'Admin' : 'Kasir'}`}>
              <span className="opc-avatar" aria-hidden="true">
                <UserRound className="size-5" />
              </span>
              <span className="hidden sm:inline">{s.name}</span>
              <ChevronDown className="hidden size-4 opacity-80 sm:inline" aria-hidden="true" />
            </span>
          </div>
        </header>
      </div>

      <div className="opc-body">
        <aside className="opc-sidebar" aria-label="Navigasi utama">
          <nav className="opc-nav">
            {GROUP_ORDER.map((g) => {
              const items = menu.filter((m) => GROUP_OF[m.to] === g)
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
            <UserMenu />
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

function UserMenu() {
  const db = useDB()
  const nav = useNavigate()
  const s = db.session!
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [accounts, setAccounts] = useState<User[]>(() => getCachedAccounts())
  const [pending, setPending] = useState<User | null>(null)
  const [passcode, setPasscode] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (s.role !== 'admin') return
    apiListUsers()
      .then((users) => { setAccounts(users); setCachedAccounts(users) })
      .catch(() => {})
  }, [s.role, s.id])

  // Ikut cache terbaru (tambah/hapus kasir di halaman Users) tanpa reload.
  useEffect(() => {
    const sync = () => setAccounts(getCachedAccounts())
    window.addEventListener('op:accounts-changed', sync)
    return () => window.removeEventListener('op:accounts-changed', sync)
  }, [])

  function resetMenu() {
    setOpen(false)
    setPending(null)
    setPasscode('')
    setErr('')
  }

  async function keluar() {
    setBusy(true)
    await apiLogout()
    setSession(null)
    nav('/redesign', { replace: true })
  }

  async function pick(u: User) {
    if (u.id === s.id) return resetMenu()
    setErr('')
    setBusy(true)
    try {
      const r = await apiSwitchAccount(u.id, undefined, u.role)
      setSession(toSession(r.user))
      resetMenu()
      nav('/redesign')
    } catch (x) {
      if (x instanceof ApiError && x.code === 'passcode_required') {
        setPending(u)
        setPasscode('')
      } else {
        setErr(x instanceof Error ? x.message : 'Gagal ganti akun.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function submitPasscode() {
    if (!pending) return
    setErr('')
    setBusy(true)
    try {
      const r = await apiSwitchAccount(pending.id, passcode, pending.role)
      setSession(toSession(r.user))
      resetMenu()
      nav('/redesign')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Passcode salah. Coba lagi.')
      setPasscode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setPending(null); setErr('') }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="opc-sideuser"
      >
        <span className="opc-avatar" aria-hidden="true">
          <UserRound className="size-5" />
        </span>
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-sm font-medium text-white">{s.name}</span>
          <small className="truncate">{s.role === 'admin' ? 'Admin' : 'Kasir'}</small>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[calc(100vw-2rem)] rounded-md bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 sm:min-w-64"
          >
            {pending ? (
              <div className="space-y-2 p-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Passcode · {pending.name}
                </p>
                <input
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitPasscode() }}
                  inputMode="numeric"
                  autoFocus
                  placeholder="•••••"
                  aria-label="Passcode 5 angka"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {err && <p className="text-xs text-destructive">{err}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setPending(null); setErr('') }}
                    className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitPasscode}
                    disabled={passcode.length !== 5 || busy}
                    className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {busy ? '…' : 'Masuk'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Ganti akun</p>
                <div className="max-h-64 overflow-y-auto">
                  {accounts.filter((a) => a.active).map((a) => {
                    const active = a.id === s.id
                    return (
                      <button
                        key={`${a.role}-${a.id}`}
                        role="menuitem"
                        disabled={busy}
                        onClick={() => pick(a)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-50 ${active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                      >
                        <span className="grid flex-1 leading-tight">
                          <span className="truncate font-medium">{a.name}</span>
                          <span className="truncate font-mono text-[11px] text-muted-foreground">
                            {a.role === 'admin' ? 'Admin' : 'Kasir'}
                          </span>
                        </span>
                        {active && <Check className="size-4 shrink-0" />}
                      </button>
                    )
                  })}
                  {accounts.length === 0 && (
                    <p className="px-2 py-2 text-xs text-muted-foreground">Daftar akun tidak tersedia.</p>
                  )}
                </div>
                {err && <p className="px-2 py-1 text-xs text-destructive">{err}</p>}
                <div className="my-1 h-px bg-border" />
                <button
                  role="menuitem"
                  onClick={keluar}
                  disabled={busy}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="size-4" />
                  {busy ? 'Keluar…' : 'Keluar'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
