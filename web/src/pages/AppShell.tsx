import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard, Store, Package, Boxes, ReceiptText, BarChart3, Users, Settings, IdCard,
  Moon, Sun, LogOut, Check, PanelLeftClose, PanelLeftOpen, ChevronDown,
} from 'lucide-react'
import '../redesign/classic.css'
import { ApiError, apiHeartbeat, apiListUsers, apiLogout, apiMe, apiSwitchAccount, getCachedAccounts, hasToken, setCachedAccounts, type User } from '../lib/api'
import { setSession, toSession, useDB, useTheme } from '../lib/store'
import { NotifBell } from '../lib/notifications'
import { Logo } from '../lib/ui'

const MENU: { label: string; to: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
  { label: 'Dashboard', to: '/app', icon: LayoutDashboard },
  { label: 'POS Kasir', to: '/app/pos', icon: Store },
  { label: 'Produk', to: '/app/produk', icon: Package, adminOnly: true },
  { label: 'Stok', to: '/app/stok', icon: Boxes, adminOnly: true },
  { label: 'Transaksi', to: '/app/transaksi', icon: ReceiptText },
  { label: 'Laporan', to: '/app/laporan', icon: BarChart3, adminOnly: true },
  { label: 'Karyawan', to: '/app/karyawan', icon: IdCard, adminOnly: true },
  { label: 'User Management', to: '/app/users', icon: Users, adminOnly: true },
  { label: 'Pengaturan', to: '/app/pengaturan', icon: Settings, adminOnly: true },
]

// Pengelompokan visual sidebar (admin). Murni tampilan — rute & permission tak berubah.
const GROUP_OF: Record<string, 'UTAMA' | 'MANAJEMEN' | 'PENGATURAN'> = {
  '/app': 'UTAMA',
  '/app/pos': 'UTAMA',
  '/app/produk': 'MANAJEMEN',
  '/app/stok': 'MANAJEMEN',
  '/app/transaksi': 'MANAJEMEN',
  '/app/laporan': 'MANAJEMEN',
  '/app/karyawan': 'PENGATURAN',
  '/app/users': 'PENGATURAN',
  '/app/pengaturan': 'PENGATURAN',
}
const GROUP_ORDER = ['UTAMA', 'MANAJEMEN', 'PENGATURAN'] as const

function isMenuActive(pathname: string, to: string) {
  return pathname === to || (to !== '/app' && pathname.startsWith(to))
}

export default function AppShell() {
  const db = useDB()
  const loc = useLocation()
  const [theme, setTheme] = useTheme()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [boot, setBoot] = useState(!hasToken())
  const s = db.session

  // Boot sesi dari token (guard masuk bila tanpa sesi valid).
  useEffect(() => {
    if (!hasToken() || s) return
    let dead = false
    apiMe()
      .then((r) => { if (!dead) setSession(toSession(r.user)) })
      .catch(() => { if (!dead) { apiLogout(); setSession(null) } })
      .finally(() => { if (!dead) setBoot(true) })
    return () => { dead = true }
  }, [s])

  // Heartbeat presence tiap 30 dtk selagi sesi ada (kontrak presence).
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
    if (hasToken() && !boot) return null
    return <Navigate to="/masuk" replace />
  }

  const menu = MENU.filter((m) => !m.adminOnly || s.role === 'admin')
  // Ikon toggle mengikuti status: tertutup→buka, terbuka→tutup.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  const navExpanded = narrow ? navOpen : !collapsed

  return (
    <div className={`opc-shell op-classic${navOpen ? ' nav-open' : ''}${collapsed ? ' nav-collapsed' : ''}`}>
      <div className="opc-toprow">
        <Link to="/app" className="opc-brand" aria-label="Dashboard">
          <Logo tone="dark" className="h-[26px] w-auto shrink-0" />
          <span>{s.store || 'Toko Anda'}</span>
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
            <span className="opc-bell">
              <NotifBell />
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
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
    // Keluar dari demo = kembali ke landing page awal.
    nav('/masuk', { replace: true })
  }

  async function pick(u: User) {
    if (u.id === s.id) return resetMenu()
    setErr('')
    setBusy(true)
    try {
      const r = await apiSwitchAccount(u.id, undefined, u.role)
      setSession(toSession(r.user))
      resetMenu()
      nav('/app')
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
      nav('/app')
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
        <span className="opc-avatar opc-avatar-initials" aria-hidden="true">
          {initials(s.name)}
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
          <div role="menu" className="opc-acc-panel">
            {pending ? (
              <div className="opc-acc-pin">
                <p className="opc-acc-head">
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
                />
                {err && <p className="opc-acc-err">{err}</p>}
                <div className="opc-acc-row">
                  <button className="opc-acc-btn" onClick={() => { setPending(null); setErr('') }}>
                    Batal
                  </button>
                  <button
                    className="opc-acc-btn primary"
                    onClick={submitPasscode}
                    disabled={passcode.length !== 5 || busy}
                  >
                    {busy ? '…' : 'Masuk'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="opc-acc-head">Ganti akun</p>
                <div className="opc-acc-list">
                  {accounts.filter((a) => a.active).map((a) => {
                    const active = a.id === s.id
                    return (
                      <button
                        key={`${a.role}-${a.id}`}
                        role="menuitem"
                        disabled={busy}
                        onClick={() => pick(a)}
                        aria-current={active || undefined}
                        className={`opc-acc-item${active ? ' active' : ''}`}
                      >
                        <span className="opc-acc-ava" aria-hidden="true">
                          {initials(a.name)}
                        </span>
                        <span className="opc-acc-meta">
                          <strong>{a.name}</strong>
                          <small>{a.role === 'admin' ? 'Admin' : 'Kasir'}</small>
                        </span>
                        {active && <Check className="opc-acc-check" aria-hidden="true" />}
                      </button>
                    )
                  })}
                  {accounts.length === 0 && (
                    <p className="px-2.5 py-2 text-xs text-muted-foreground">Daftar akun tidak tersedia.</p>
                  )}
                </div>
                {err && <p className="opc-acc-err">{err}</p>}
                <div className="opc-acc-div" />
                {(
                  <button
                    role="menuitem"
                    onClick={keluar}
                    disabled={busy}
                    className="opc-acc-logout"
                  >
                    <LogOut aria-hidden="true" />
                    {busy ? 'Keluar…' : 'Keluar'}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

