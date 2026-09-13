import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard, Store, Package, Boxes, ReceiptText, BarChart3, Users, Settings, IdCard,
  Moon, Sun, LogOut, ChevronsUpDown, Check, UserRound,
} from 'lucide-react'
import { ApiError, apiHeartbeat, apiListUsers, apiLogout, apiMe, apiSwitchAccount, getCachedAccounts, hasToken, setCachedAccounts, type User } from '../lib/api'
import { setSession, toSession, useDB, useTheme } from '../lib/store'
import { NotifBell } from '../lib/notifications'
import { Logo } from '../lib/ui'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

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
  const [boot, setBoot] = useState(!hasToken())
  const s = db.session

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
  // ponytail: interval polos; browser throttle otomatis saat tab hidden.
  useEffect(() => {
    if (!s) return
    apiHeartbeat()
    const timer = setInterval(apiHeartbeat, 30_000)
    return () => clearInterval(timer)
  }, [s?.id, s?.role])

  if (!s) {
    if (hasToken() && !boot) return null
    return <Navigate to="/masuk" replace />
  }

  const menu = MENU.filter((m) => !m.adminOnly || s.role === 'admin')
  const isAdmin = s.role === 'admin'

  return (
    <SidebarProvider>
      <Sidebar>
        {isAdmin ? (
          <>
            <SidebarHeader className="px-4 pt-4 pb-0">
              <Link to="/app" className="flex h-12 items-center gap-2.5 rounded-[10px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                <Logo className="h-8 w-auto shrink-0" />
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-sidebar-foreground">{s.store || 'Toko Andika'}</span>
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent className="px-4">
              {/* Reserved empty space — area search dikosongkan sesuai spek, navigasi tidak digeser naik. */}
              <div aria-hidden="true" className="h-10 shrink-0" />
              <nav aria-label="Navigasi utama" className="flex flex-col gap-6 pb-4">
                {GROUP_ORDER.map((g) => (
                  <div key={g}>
                    <p className="mb-2 flex items-center gap-2.5 px-3 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                      {g}
                      {g !== 'UTAMA' && <span aria-hidden="true" className="h-px flex-1 bg-sidebar-border" />}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {menu.filter((m) => GROUP_OF[m.to] === g).map((m) => {
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
            </SidebarContent>
            <SidebarFooter className="px-4 pb-4">
              <UserMenu variant="card" />
            </SidebarFooter>
          </>
        ) : (
          <>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" render={<Link to="/app" />}>
                      <Logo className="h-8 w-auto shrink-0" />
                      <span className="grid flex-1 text-left leading-tight">
                        <span className="truncate font-mono text-xs text-muted-foreground">{s.store}</span>
                      </span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarMenu>
                  {menu.map((m) => {
                    const active = isMenuActive(loc.pathname, m.to)
                    return (
                      <SidebarMenuItem key={m.to}>
                        <SidebarMenuButton isActive={active} render={<Link to={m.to} />}>
                          <m.icon />
                          <span>{m.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <UserMenu />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </>
        )}
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
            title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
            className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <div className="ml-auto">
            <NotifBell />
          </div>
        </header>
        <main className="w-full min-w-0 flex-1 space-y-4 overflow-x-clip p-4 sm:space-y-6 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function UserMenu({ variant = 'legacy' }: { variant?: 'legacy' | 'card' }) {
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
        className={variant === 'card'
          ? 'flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-background p-2.5 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring'
          : 'flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring'}
      >
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg"><UserRound className="size-5 text-white dark:text-black" /></AvatarFallback>
        </Avatar>
        <span className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{s.name}</span>
          <span className="truncate text-xs text-muted-foreground">{s.role === 'admin' ? 'Admin' : 'Kasir'}</span>
        </span>
        <ChevronsUpDown className="ml-auto size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[calc(100vw-2rem)] rounded-lg bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 sm:min-w-64"
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
                        <Avatar className="size-7 rounded-md">
                          <AvatarFallback className="rounded-md"><UserRound className="size-4 text-white dark:text-black" /></AvatarFallback>
                        </Avatar>
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