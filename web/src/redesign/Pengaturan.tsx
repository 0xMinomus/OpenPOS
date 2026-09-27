import { useCallback, useEffect, useMemo, useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Check, ChevronDown, Eye, EyeOff, ImagePlus, Info, KeyRound, Lock, LogOut, Mail, MapPin, Phone, Printer, ShieldCheck, Users,
} from 'lucide-react'
import {
  ApiError, apiGetSettings, apiListTransactions, apiListUsers, apiLogout, apiResetPassword, apiSendPasswordResetOtp, apiSetPasscode, apiUpdateSettings,
  type Page, type StoreHours, type StoreSettings, type Trx, type User,
} from './mock-api'
import { PageHeader } from './PageHeader'
import { useCache } from '../lib/cache'
import { fmtDate, fmtRp, fmtTime, getSession, setSession, useDB } from '../lib/store'
import { Button, Input, Modal, NumInput, Pill } from '../lib/ui'
import { Receipt } from '../lib/receipt'
import { Skeleton } from '@/components/ui/skeleton'

const TABS = [
  { id: 'akun', label: 'Akun' },
  { id: 'toko', label: 'Toko' },
  { id: 'struk', label: 'Struk' },
  { id: 'pajak', label: 'Pajak' },
] as const

type TabId = (typeof TABS)[number]['id']

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB (UTC+7)' },
  { value: 'Asia/Makassar', label: 'WITA (UTC+8)' },
  { value: 'Asia/Jayapura', label: 'WIT (UTC+9)' },
]

// Label ramah untuk nilai IANA (dipakai di badge preview); fallback ke nilai mentah.
function tzLabel(v: string) {
  return TIMEZONES.find((t) => t.value === v)?.label ?? v
}

const INPUT_CLS = 'w-full rounded-md border border-border bg-paper px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fog focus:border-jet focus:outline-2 focus:outline-accent-soft disabled:opacity-60'
const LABEL_CLS = 'flex flex-col gap-1.5 text-[13px] font-medium text-steel'
const SELECT_CLS = 'w-full cursor-pointer appearance-none rounded-md border border-border bg-paper py-2.5 pr-10 pl-3.5 text-[15px] text-fg transition-colors hover:border-jet focus:border-jet focus:outline-2 focus:outline-accent-soft disabled:cursor-not-allowed disabled:opacity-60'

// Dropdown konsisten: chevron kustom + tinggi sejajar input, bukan tampilan default browser.
function Select({ children, ...rest }: { children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...rest} className={SELECT_CLS}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fog" aria-hidden="true" />
    </span>
  )
}

// Settings extended (kontrak docs/API-CONTRACT-SETTINGS-EXTENDED.md, live
// backend 11 Sep): opsi + rumus pajak server (inclusive + rounding).
const BUSINESS_TYPES = [
  { value: '', label: 'Pilih jenis usaha…' },
  { value: 'retail', label: 'Retail / Kelontong' },
  { value: 'fnb', label: 'Makanan & Minuman' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'jasa', label: 'Jasa' },
  { value: 'lainnya', label: 'Lainnya' },
]

const HOURS_LABELS = ['Senin – Jumat', 'Sabtu', 'Minggu']

// Rumus pajak = backend repo/transaction.go: inclusive → total tetap = base,
// tax = base − base/(1+pct/100); rounding none = round_half_up, down = floor,
// up = ceil.
function calcTax(base: number, pct: number, inclusive: boolean, rounding: string) {
  if (pct <= 0) return { tax: 0, total: base }
  const raw = inclusive ? base - base / (1 + pct / 100) : (base * pct) / 100
  const tax = rounding === 'down' ? Math.floor(raw) : rounding === 'up' ? Math.ceil(raw) : Math.round(raw)
  return { tax, total: inclusive ? base : base + tax }
}

function defaultHours(): StoreHours[] {
  return [
    { days: HOURS_LABELS[0], open: '08:00', close: '21:00' },
    { days: HOURS_LABELS[1], open: '08:00', close: '21:00' },
    { days: HOURS_LABELS[2], open: null, close: null },
  ]
}

function todayStr() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl bg-cream p-4 sm:p-6 ${className}`}>{children}</section>
}

function CardHead({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      {kicker && <p className="font-mono text-[11px] uppercase tracking-wider text-fog">{kicker}</p>}
      <h2 className="mt-0.5 text-[15px] font-medium text-fg">{title}</h2>
      {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-fg">{value}</span>
    </div>
  )
}

// Field yang belum didukung backend: tampil nonaktif + kontrak
// docs/API-CONTRACT-SETTINGS-EXTENDED.md.
function Soon({ children }: { children: ReactNode }) {
  return (
    <div className="opacity-80">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex-1">{children}</div>
        <Pill tone="muted">Segera</Pill>
      </div>
      <p className="-mt-0.5 mb-1 text-xs font-normal text-fog">Segera hadir — menunggu backend.</p>
    </div>
  )
}

function FormActions({ dirty, busy, onReset, onSave }: { dirty: boolean; busy: boolean; onReset: () => void; onSave: () => void }) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="ghost" onClick={onReset} disabled={busy || !dirty}>Reset</Button>
      <Button onClick={onSave} disabled={busy || !dirty}>{busy ? 'Menyimpan…' : 'Simpan Perubahan'}</Button>
    </div>
  )
}

function PwField({ label, value, onChange, show, onToggle, auto }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; auto: string }) {
  return (
    <label className={LABEL_CLS}>
      {label}
      <span className="relative block">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={auto}
          className={`${INPUT_CLS} pr-11`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-fog hover:text-fg"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  )
}

function pwScore(pw: string) {
  let s = 0
  if (pw.length >= 8) s += 1
  if (pw.length >= 12) s += 1
  if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) s += 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) s += 1
  return Math.min(s, 4)
}

const SCORE_LABEL = ['Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat']
const SCORE_BAR = ['bg-ember', 'bg-ember', 'bg-sunbeam', 'bg-sprout', 'bg-sprout']

const SAMPLE_ITEMS = [
  { name: 'Indomie Goreng', qty: 2, price: 12000 },
  { name: 'Aqua 600ml', qty: 1, price: 5000 },
  { name: 'Roti Tawar', qty: 1, price: 15000 },
]

export default function Pengaturan() {
  const nav = useNavigate()
  const { session } = useDB()
  const today = todayStr()
  const [tab, setTab] = useState<TabId>('akun')
  const [form, setForm] = useState<StoreSettings | null>(null)
  const [saved, setSaved] = useState<StoreSettings | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const accountList = useCache<User[]>(`users:${session?.id}`, () => apiListUsers())
  const users = accountList.data ?? []
  const todayTrx = useCache<Page<Trx>>(`pengaturan-trx:${session?.id}:${today}`, () => apiListTransactions({ date: today, limit: 200, page: 1 }))

  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Passcode (tab Akun → Keamanan): kelola passcode admin + semua kasir.
  const [manageOpen, setManageOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pcVal, setPcVal] = useState('')
  const [pcBusy, setPcBusy] = useState(false)
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null)

  // Ganti kata sandi (section khusus di tab Akun): kata sandi baru +
  // verifikasi kode OTP yang dikirim ke email.
  const [showNew, setShowNew] = useState(false)
  const [showNew2, setShowNew2] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [otpRequested, setOtpRequested] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdErr, setPwdErr] = useState('')

  // Cetak uji coba struk.
  const [printTest, setPrintTest] = useState(false)

  function fetchSettings() {
    return apiGetSettings()
      .then((s) => { setForm(s); setSaved(s) })
      .catch((e) => { setLoadErr(e instanceof Error ? e.message : 'Gagal memuat pengaturan.') })
  }

  useEffect(() => { fetchSettings() }, [])

  function retry() {
    setLoadErr(''); setErr('')
    fetchSettings()
  }

  const set = (k: keyof StoreSettings) => (v: string) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const setV = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  // Dukungan backend dideteksi dari keberadaan key (kontrak §9): backend lama
  // tanpa key → field tampil nonaktif "Segera" seperti semula.
  const hasExt = !!saved && typeof saved === 'object' && 'businessType' in saved
  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved)

  async function save() {
    if (!form) return
    setMsg(''); setErr(''); setBusy(true)
    try {
      const s = await apiUpdateSettings(form)
      setForm(s); setSaved(s)
      const cur = getSession()
      if (cur && cur.store !== s.storeName) setSession({ ...cur, store: s.storeName })
      setMsg('Pengaturan berhasil disimpan.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan perubahan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  function resetForm() {
    if (saved) { setForm(saved); setMsg(''); setErr('') }
  }

  async function savePc(u: User) {
    if (!/^\d{5}$/.test(pcVal)) return setErr('Passcode harus 5 angka.')
    setMsg(''); setErr(''); setPcBusy(true)
    try {
      await apiSetPasscode(u.id, pcVal, u.role)
      accountList.mutate(users.map((x) => (x.id === u.id ? { ...x, has_passcode: true } : x)))
      setEditingId(null); setPcVal('')
      setMsg(`Passcode ${u.name} disimpan.`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan passcode.')
    } finally {
      setPcBusy(false)
    }
  }

  async function clearPc(u: User) {
    setMsg(''); setErr(''); setPcBusy(true)
    try {
      await apiSetPasscode(u.id, '', u.role)
      accountList.mutate(users.map((x) => (x.id === u.id ? { ...x, has_passcode: false } : x)))
      setConfirmResetId(null)
      setMsg(`Passcode ${u.name} dinonaktifkan.`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menghapus passcode.')
    } finally {
      setPcBusy(false)
    }
  }

  const sendPwOtp = useCallback(async () => {
    const email = session?.email.trim().toLowerCase() ?? ''
    if (!email) return setPwdErr('Email akun tidak ditemukan.')
    setPwdErr(''); setOtp(''); setOtpSending(true); setOtpRequested(true)
    try {
      await apiSendPasswordResetOtp(email)
      setOtpSent(true)
      setCooldown(60)
    } catch (x) {
      if (x instanceof ApiError && x.status === 429) setCooldown(60)
      setOtpSent(false)
      setPwdErr(x instanceof Error ? x.message : 'Gagal mengirim kode. Coba lagi.')
    } finally {
      setOtpSending(false)
    }
  }, [session?.email])

  // Verifikasi muncul otomatis: begitu kata sandi baru valid,
  // kode OTP langsung dikirim tanpa perlu tekan tombol.
  const pwValid = newPw.length >= 8 && newPw === newPw2
  useEffect(() => {
    if (!pwValid || otpRequested || cooldown > 0 || pwdBusy) return
    const t = setTimeout(() => { sendPwOtp() }, 400)
    return () => clearTimeout(t)
  }, [pwValid, otpRequested, cooldown, pwdBusy, sendPwOtp])

  async function submitPwReset() {
    const email = session?.email.trim().toLowerCase() ?? ''
    setPwdErr('')
    if (newPw.length < 8) return setPwdErr('Kata sandi baru minimal 8 karakter.')
    if (newPw !== newPw2) return setPwdErr('Konfirmasi kata sandi tidak cocok.')
    if (otp.length !== 6) return setPwdErr('Masukkan kode 6 digit dari email.')
    setPwdBusy(true)
    try {
      await apiResetPassword(email, otp, newPw)
      setNewPw(''); setNewPw2(''); setOtp(''); setOtpSent(false)
      await apiLogout()
      setSession(null)
      nav('/demo', { replace: true })
    } catch (x) {
      if (x instanceof ApiError && (x.status === 410 || x.status === 429)) setCooldown(0)
      if (x instanceof ApiError && x.status === 400) setOtp('')
      setPwdErr(x instanceof Error ? x.message : 'Gagal mengganti kata sandi.')
    } finally {
      setPwdBusy(false)
    }
  }

  async function keluar() {
    setBusy(true)
    await apiLogout()
    setSession(null)
    nav('/demo', { replace: true })
  }

  const s = session
  const me = users.find((u) => u.id === s?.id) ?? null
  const cashiers = users.filter((u) => u.role === 'cashier')
  const manageUsers = me ? [me, ...cashiers.filter((c) => c.id !== me.id)] : [...cashiers]
  const taxed = todayTrx.data?.items.filter((t) => t.tax > 0).length ?? 0
  const trxTotal = todayTrx.data?.total ?? 0

  const storeComplete = (form?.storeName.trim() ?? '') !== ''

  const sample = useMemo(() => {
    const taxOn = form?.taxEnabled ?? false
    const pct = form?.taxPct ?? 0
    const subtotal = SAMPLE_ITEMS.reduce((n, i) => n + i.qty * i.price, 0)
    if (!taxOn) return { subtotal, tax: 0, total: subtotal }
    const { tax, total } = calcTax(subtotal, pct, form?.taxInclusive ?? false, form?.taxRounding ?? 'none')
    return { subtotal, tax, total }
  }, [form])

  const sampleTrx: Trx = useMemo(() => ({
    id: '1',
    cashier_name: session?.name ?? 'Kasir',
    items: SAMPLE_ITEMS.map((i, ix) => ({ product_id: `s${ix}`, name: i.name, buy_price: i.price, price: i.price, qty: i.qty })),
    subtotal: sample.subtotal,
    discount: 0,
    tax: sample.tax,
    total: sample.total,
    method: 'Cash',
    paid: sample.total,
    change: 0,
    status: 'completed',
    customer: '',
    created_at: new Date().toISOString(),
  }), [sample, session?.name])

  if (!form) {
    return (
      <>
        <PageHeader title="Pengaturan" sub="Kelola akun, toko, struk, pajak, dan keamanan." crumb="Pengaturan" />
        {loadErr ? (
          <div className="max-w-2xl rounded-2xl bg-cream p-4 text-center sm:p-6">
            <p className="text-sm text-ember">Gagal memuat pengaturan.</p>
            <p className="mt-1 text-[13px] text-muted">Coba muat ulang halaman.</p>
            <Button className="mt-4" onClick={retry}>Coba Lagi</Button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-hidden="true">
              {['w-[76px]', 'w-[72px]', 'w-[76px]', 'w-[72px]'].map((w, i) => (
                <Skeleton key={i} className={`h-9 shrink-0 rounded-full ${w}`} />
              ))}
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Memuat pengaturan">
              <div className="rounded-2xl bg-cream p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="size-11 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 basis-32 space-y-2">
                    <Skeleton className="h-4 w-32 max-w-full" />
                    <Skeleton className="h-3 w-48 max-w-full" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
                <div className="mt-4 divide-y divide-dove border-t border-dove">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Skeleton className="h-12 w-full rounded-full sm:w-40" />
                  <Skeleton className="h-12 w-full rounded-full sm:w-28" />
                </div>
              </div>
              <div className="rounded-2xl bg-cream p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 shrink-0 rounded" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-44 max-w-full" />
                    <Skeleton className="h-3 w-56 max-w-full" />
                  </div>
                </div>
                <div className="mt-4 divide-y divide-dove rounded-xl border border-dove px-4">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Skeleton className="h-12 w-full rounded-full sm:w-40" />
                  <Skeleton className="h-12 w-full rounded-full sm:w-44" />
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <PageHeader title="Pengaturan" sub="Kelola akun, toko, struk, pajak, dan keamanan." crumb="Pengaturan" />

      {err && <p className="mb-4 rounded-lg bg-sand px-3.5 py-2.5 text-[13px] text-ember" role="alert">{err}</p>}
      {msg && <p className="mb-4 rounded-lg bg-surface px-3.5 py-2.5 text-[13px] text-sprout">{msg}</p>}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Subhalaman pengaturan">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'border-jet bg-jet text-paper' : 'border-dove bg-cream text-muted hover:border-jet'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'akun' && (
        <div className="space-y-4">
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Card>
              <CardHead kicker="Akun saya" title="Informasi Akun" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-jet font-mono text-lg text-paper" aria-hidden="true">
                  {(session?.name ?? '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 basis-32">
                  <p className="break-words text-[15px] font-medium text-fg">{session?.name ?? '—'}</p>
                  <p className="break-words text-[13px] text-muted">{session?.email || 'Tanpa email'} · {session?.store ?? '—'}</p>
                </div>
                <span className="flex flex-wrap gap-1.5">
                  <Pill tone={session?.role === 'admin' ? 'ok' : 'muted'}>{session?.role === 'admin' ? 'Admin' : 'Kasir'}</Pill>
                  <Pill tone={me?.active === false ? 'muted' : 'ok'}>{me?.active === false ? 'Nonaktif' : 'Akun Aktif'}</Pill>
                </span>
              </div>
              <div className="mt-4 divide-y divide-dove border-t border-dove">
                <MetaRow label="Toko" value={session?.store ?? '—'} />
                <MetaRow label="Bergabung" value={me?.created_at ? fmtDate(me.created_at) : '—'} />
                <MetaRow
                  label="Terakhir login"
                  value={!me?.last_seen_at ? '—' : me.last_seen_at.slice(0, 10) >= today ? `Hari ini, ${fmtTime(me.last_seen_at)}` : fmtDate(me.last_seen_at)}
                />
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {session?.role === 'admin' && (
                  <Link to="/demo/users" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dove bg-transparent px-6 py-3 text-[15px] font-medium transition hover:border-jet sm:w-auto">
                    <Users className="size-4" /> Kelola Kasir
                  </Link>
                )}
                <Button variant="danger" onClick={keluar} disabled={busy} className="w-full sm:w-auto"><LogOut className="size-4" /> Keluar</Button>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Lock className="size-4 text-steel" aria-hidden="true" />
                <div>
                  <h2 className="text-[15px] font-medium text-fg">Keamanan &amp; Passcode</h2>
                  <p className="mt-0.5 text-[13px] text-muted">Atur passcode untuk akses kasir dan keamanan sistem.</p>
                </div>
              </div>
              <div className="divide-y divide-dove rounded-xl border border-dove px-4">
                <div className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-muted">Status Passcode</span>
                  {me == null ? (
                    <span className="text-fog">—</span>
                  ) : (
                    <Pill tone={me.has_passcode ? 'ok' : 'muted'}>{me.has_passcode ? 'Aktif' : 'Tidak aktif'}</Pill>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-muted">Akun dilindungi</span>
                  <span className="min-w-0 break-words text-right font-medium text-fg">{session?.name ?? '—'}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => { setManageOpen(true); setEditingId(null); setPcVal(''); setConfirmResetId(null); setErr('') }}>
                  <KeyRound className="size-4" /> Manage Passcode
                </Button>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface px-3.5 py-3 text-[13px] text-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-steel" aria-hidden="true" />
                <p>Gunakan passcode yang kuat untuk melindungi data transaksi dan batasi akses hanya untuk kasir yang berwenang.</p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHead title="Kata Sandi Akun" sub="Perbarui kata sandi untuk melindungi akun Anda." />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                {pwdErr && <p className="rounded-lg bg-sand px-3.5 py-2.5 text-[13px] text-ember" role="alert">{pwdErr}</p>}
                <PwField label="Kata sandi baru" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew((v) => !v)} auto="new-password" />
                {newPw !== '' && (
                  <div aria-live="polite">
                    <div className="flex gap-1" aria-hidden="true">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < pwScore(newPw) ? SCORE_BAR[pwScore(newPw)] : 'bg-dove'}`} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-muted">Kekuatan: <span className="font-medium text-fg">{SCORE_LABEL[pwScore(newPw)]}</span></p>
                    <ul className="mt-2 space-y-1">
                      {[
                        { ok: newPw.length >= 8, label: 'Minimal 8 karakter' },
                        { ok: /\d/.test(newPw), label: 'Mengandung angka' },
                        { ok: /[a-z]/.test(newPw) && /[A-Z]/.test(newPw), label: 'Huruf besar dan kecil' },
                      ].map((r) => (
                        <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-sprout' : 'text-fog'}`}>
                          {r.ok ? <Check className="size-3.5" /> : <span className="grid size-3.5 place-items-center" aria-hidden="true">·</span>}
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <PwField label="Ulangi kata sandi baru" value={newPw2} onChange={setNewPw2} show={showNew2} onToggle={() => setShowNew2((v) => !v)} auto="new-password" />
                {(otpSending || otpSent) && (
                  <div className="space-y-2" aria-live="polite">
                    <p className="text-[13px] text-muted">
                      {otpSent ? (
                        <>Kode 6 digit terkirim ke <strong className="text-fg">{session?.email.trim().toLowerCase()}</strong>. Cek email lalu masukkan di bawah. Kode berlaku 10 menit.</>
                      ) : (
                        'Mengirim kode verifikasi ke email…'
                      )}
                    </p>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      type="text" inputMode="numeric" autoComplete="one-time-code"
                      placeholder="••••••"
                      aria-label="Kode verifikasi 6 digit"
                      className="w-full rounded-md border border-border bg-paper px-3.5 py-3 text-center font-mono text-xl tracking-[0.5em] focus:border-jet focus:outline-none"
                    />
                    {otpRequested && (
                      <button
                        type="button"
                        onClick={() => sendPwOtp()}
                        disabled={cooldown > 0 || pwdBusy || otpSending}
                        className="text-[13px] font-medium text-jet hover:underline disabled:opacity-50"
                      >
                        {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim ulang kode'}
                      </button>
                    )}
                  </div>
                )}
                <Button onClick={submitPwReset} disabled={pwdBusy || newPw.length < 8 || newPw !== newPw2 || !otpSent || otp.length !== 6} className="w-full sm:w-auto">
                  {pwdBusy ? 'Menyimpan…' : 'Simpan kata sandi baru'}
                </Button>
              </div>
              <div className="h-fit rounded-xl bg-surface p-4 text-[13px]">
                <p className="flex items-center gap-2 font-medium text-fg"><ShieldCheck className="size-4 text-steel" /> Cara mengganti kata sandi</p>
                <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 text-muted">
                  <li>Tulis kata sandi baru di form sebelah kiri, lalu ulangi sekali lagi.</li>
                  <li>Kode verifikasi terkirim otomatis ke email Anda begitu kata sandi barunya valid. Buka email Anda.</li>
                  <li>Masukkan kode 6 digit yang Anda terima, lalu tekan Simpan kata sandi baru.</li>
                  <li>Selesai. Anda akan keluar otomatis dan bisa masuk lagi dengan kata sandi yang baru.</li>
                </ol>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-paper px-3 py-2.5 text-muted">
                  <Info className="mt-0.5 size-4 shrink-0 text-steel" aria-hidden="true" />
                  <p>Tips: pakai kata sandi yang belum pernah dipakai di aplikasi lain. Kode hanya berlaku 10 menit, jadi langsung dipakai begitu diterima.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'toko' && (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Informasi Toko" sub="Lengkapi informasi toko Anda." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nama Toko *" value={form.storeName} onChange={set('storeName')} placeholder="Toko Andika" />
              {hasExt ? (
                <label className={LABEL_CLS}>
                  Jenis Usaha *
                  <Select value={form.businessType ?? ''} onChange={(e) => setV('businessType', e.target.value)}>
                    {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </label>
              ) : (
              <Soon>
                <label className={LABEL_CLS}>
                  Jenis Usaha *
                  <Select disabled value="" onChange={() => {}}>
                    <option value="">Menunggu backend</option>
                  </Select>
                </label>
              </Soon>
              )}
              <Input label="No. Telepon" value={form.phone} onChange={set('phone')} placeholder="0812…" />
              {hasExt ? (
                <label className={LABEL_CLS}>
                  Email
                  <input type="email" value={form.email ?? ''} onChange={(e) => setV('email', e.target.value)} placeholder="toko@gmail.com" className={INPUT_CLS} />
                </label>
              ) : (
              <Soon>
                <label className={LABEL_CLS}>
                  Email
                  <input disabled className={INPUT_CLS} value="" placeholder="Menunggu backend" onChange={() => {}} />
                </label>
              </Soon>
              )}
              <label className={`${LABEL_CLS} sm:col-span-2`}>
                Alamat
                <textarea value={form.address} onChange={(e) => set('address')(e.target.value)} rows={3} placeholder="Jl. …" className={INPUT_CLS} />
              </label>
              {hasExt ? (
                <label className={LABEL_CLS}>
                  Kota
                  <input value={form.city ?? ''} onChange={(e) => setV('city', e.target.value)} placeholder="Makassar" className={INPUT_CLS} />
                </label>
              ) : (
              <Soon>
                <label className={LABEL_CLS}>
                  Kota
                  <input disabled className={INPUT_CLS} value="" placeholder="Menunggu backend" onChange={() => {}} />
                </label>
              </Soon>
              )}
              {hasExt ? (
                <label className={LABEL_CLS}>
                  Provinsi
                  <input value={form.province ?? ''} onChange={(e) => setV('province', e.target.value)} placeholder="Sulawesi Selatan" className={INPUT_CLS} />
                </label>
              ) : (
              <Soon>
                <label className={LABEL_CLS}>
                  Provinsi
                  <Select disabled value="" onChange={() => {}}>
                    <option value="">Menunggu backend</option>
                  </Select>
                </label>
              </Soon>
              )}
              {hasExt ? (
                <label className={LABEL_CLS}>
                  Mata Uang
                  <input value={form.currency ?? 'IDR'} onChange={(e) => setV('currency', e.target.value.toUpperCase().slice(0, 3))} placeholder="IDR" maxLength={3} className={`${INPUT_CLS} font-mono uppercase`} />
                </label>
              ) : (
              <Soon>
                <label className={LABEL_CLS}>
                  Mata Uang
                  <Select disabled value="IDR" onChange={() => {}}>
                    <option value="IDR">Rupiah (IDR)</option>
                  </Select>
                </label>
              </Soon>
              )}
              <label className={LABEL_CLS}>
                Timezone
                <Select value={form.timezone} onChange={(e) => set('timezone')(e.target.value)}>
                  {!TIMEZONES.some((t) => t.value === form.timezone) && <option value={form.timezone}>{form.timezone}</option>}
                  {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </label>
            </div>
            <div className="mt-5">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-[13px] font-medium text-steel">Jam Operasional</p>
                {!hasExt && <Pill tone="muted">Segera</Pill>}
              </div>
              {hasExt ? (
              <>
              <p className="mb-2 text-xs text-fog">Atur jam operasional toko Anda. Hari tanpa centang = tutup.</p>
              <div className="space-y-2">
                {((form.hours?.length === 3 ? form.hours : defaultHours())).map((h, i) => {
                  const on = h.open != null && h.close != null
                  const upd = (patch: Partial<StoreHours>) => {
                    const cur = form.hours?.length === 3 ? form.hours : defaultHours()
                    setV('hours', cur.map((r, ix) => (ix === i ? { ...r, ...patch } : r)))
                  }
                  return (
                  <div key={h.days} className="flex flex-wrap items-center gap-2 text-sm">
                    <label className="flex min-w-32 cursor-pointer items-center gap-2 text-fg">
                      <input
                        type="checkbox" checked={on}
                        onChange={(e) => upd(e.target.checked ? { open: '08:00', close: '21:00' } : { open: null, close: null })}
                        className="h-4 w-4 accent-jet"
                      /> {h.days}
                    </label>
                    {on ? (
                      <>
                        <input type="time" value={h.open ?? '08:00'} onChange={(e) => upd({ open: e.target.value })} aria-label="Jam buka" className="w-24 rounded-md border border-border bg-paper px-2 py-1.5 font-mono text-[13px] tabular-nums" />
                        <span className="text-fog">—</span>
                        <input type="time" value={h.close ?? '21:00'} onChange={(e) => upd({ close: e.target.value })} aria-label="Jam tutup" className="w-24 rounded-md border border-border bg-paper px-2 py-1.5 font-mono text-[13px] tabular-nums" />
                      </>
                    ) : (
                      <span className="text-[13px] text-fog">Tutup</span>
                    )}
                  </div>
                  )
                })}
              </div>
              </>
              ) : (
              <>
              <p className="mb-2 text-xs text-fog">Atur jam operasional toko Anda. Segera hadir — menunggu backend.</p>
              <div className="space-y-2 opacity-80">
                {[['Senin – Jumat', true], ['Sabtu', true], ['Minggu', false]].map(([day, on]) => (
                  <div key={day as string} className="flex flex-wrap items-center gap-2 text-sm">
                    <label className="flex min-w-32 cursor-not-allowed items-center gap-2 text-fg">
                      <input type="checkbox" checked={!!on} disabled className="h-4 w-4 accent-jet" /> {day}
                    </label>
                    {on ? (
                      <>
                        <input disabled value="08:00" onChange={() => {}} aria-label="Jam buka" className="w-24 rounded-md border border-border bg-paper px-2 py-1.5 font-mono text-[13px] tabular-nums" />
                        <span className="text-fog">—</span>
                        <input disabled value="21:00" onChange={() => {}} aria-label="Jam tutup" className="w-24 rounded-md border border-border bg-paper px-2 py-1.5 font-mono text-[13px] tabular-nums" />
                      </>
                    ) : (
                      <span className="text-[13px] text-fog">Tutup</span>
                    )}
                  </div>
                ))}
              </div>
              </>
              )}
            </div>
            <FormActions dirty={dirty} busy={busy} onReset={resetForm} onSave={save} />
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHead title="Preview Profil Toko" sub="Ini adalah tampilan informasi toko Anda." />
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-fog"><ImagePlus className="size-5" /></span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-fg">{form.storeName || '—'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-[13px]">
                <p className="flex items-center gap-2 text-muted"><Phone className="size-3.5 shrink-0" />{form.phone || '—'}</p>
                <p className="flex items-center gap-2 text-muted"><Mail className="size-3.5 shrink-0" />{form.email || '—'}</p>
                <p className="flex items-start gap-2 text-muted"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span>{[form.address, form.city, form.province].filter(Boolean).join(', ') || '—'}</span></p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="muted">{tzLabel(form.timezone)}</Pill>
                {!!form.businessType && <Pill tone="muted">{BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label ?? form.businessType}</Pill>}
                {!!form.currency && <Pill tone="muted">{form.currency}</Pill>}
              </div>
            </Card>
            <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-[13px] ${storeComplete ? 'border-sprout/40 bg-success-bg text-sprout' : 'border-dove bg-surface text-muted'}`}>
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium text-fg">{storeComplete ? 'Informasi toko lengkap' : 'Informasi toko belum lengkap'}</p>
                <p className="mt-0.5">{storeComplete ? 'Semua informasi penting sudah diisi dengan benar.' : 'Lengkapi nama toko yang masih diperlukan.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'struk' && (
        <div className="grid items-start gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHead title="Pengaturan Struk" sub="Atur tampilan dan konten struk sesuai kebutuhan toko Anda." />
            <div className="space-y-4">
              <Input label="Header Toko" value={form.storeName} onChange={set('storeName')} hint="Nama toko yang akan ditampilkan di struk" />
              <label className={LABEL_CLS}>
                Footer Struk
                <textarea value={form.receiptHeader} onChange={(e) => set('receiptHeader')(e.target.value)} rows={2} placeholder="Terima kasih telah berbelanja di toko kami." className={INPUT_CLS} />
              </label>
              <div>
                <p className="mb-1 text-[13px] font-medium text-steel">Tampilan struk</p>
                {hasExt ? (
                <div className="divide-y divide-dove rounded-xl border border-dove px-4">
                  {([
                    ['Tampilkan Nama Kasir', 'receiptShowCashier'],
                    ['Tampilkan Metode Pembayaran', 'receiptShowMethod'],
                    ['Tampilkan Pajak', 'receiptShowTax'],
                    ['Tampilkan Diskon', 'receiptShowDiscount'],
                    ['Tampilkan QRIS / Catatan', 'receiptShowNote'],
                  ] as const).map(([l, k]) => (
                    <label key={l} className="flex cursor-pointer items-center justify-between gap-3 py-2.5 text-sm text-fg">
                      {l}
                      <input
                        type="checkbox" checked={form[k] ?? true}
                        onChange={(e) => setV(k, e.target.checked)}
                        className="h-4 w-4 accent-jet"
                      />
                    </label>
                  ))}
                </div>
                ) : (
                <div className="divide-y divide-dove rounded-xl border border-dove px-4 opacity-80">
                  {['Tampilkan Nama Kasir', 'Tampilkan Metode Pembayaran', 'Tampilkan Pajak', 'Tampilkan Diskon', 'Tampilkan QRIS / Catatan'].map((l) => (
                    <label key={l} className="flex cursor-not-allowed items-center justify-between gap-3 py-2.5 text-sm text-fg">
                      {l}
                      <span className="flex items-center gap-2">
                        <Pill tone="muted">Segera</Pill>
                        <input type="checkbox" checked disabled className="h-4 w-4 accent-jet" />
                      </span>
                    </label>
                  ))}
                </div>
                )}
              </div>
              <label className={LABEL_CLS}>
                Lebar Kertas
                <Select value={form.paper} onChange={(e) => set('paper')(e.target.value)}>
                  <option value="58mm">58 mm (Thermal)</option>
                  <option value="80mm">80 mm (Thermal)</option>
                </Select>
              </label>
              <label className={LABEL_CLS}>
                Pesan Footer
                <textarea
                  value={form.receiptFooter}
                  onChange={(e) => set('receiptFooter')(e.target.value.slice(0, 200))}
                  rows={2}
                  placeholder="Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan."
                  className={INPUT_CLS}
                />
                <span className="text-xs font-normal text-fog">{form.receiptFooter.length}/200</span>
              </label>
            </div>
            <FormActions dirty={dirty} busy={busy} onReset={resetForm} onSave={save} />
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHead title="Preview Struk" sub="Ini adalah tampilan struk yang akan dicetak." />
              <div className="flex justify-center overflow-x-auto rounded-xl bg-surface p-4">
                <div className="bg-white px-3 py-4 font-mono text-[11px] leading-relaxed text-black" style={{ width: form.paper, maxWidth: '100%' }}>
                  <p className="text-center text-[13px] font-bold uppercase">{form.storeName || '—'}</p>
                  {form.address && <p className="mt-0.5 text-center text-[10px]">{form.address}</p>}
                  {form.phone && <p className="text-center text-[10px]">{form.phone}</p>}
                  <div className="receipt-hr my-2" aria-hidden="true" />
                  <p>No. #TRX-00001</p>
                  {(form.receiptShowCashier ?? true) && <p>Kasir: {session?.name ?? '—'}</p>}
                  <p>Tanggal: {today}</p>
                  <div className="receipt-hr my-2" aria-hidden="true" />
                  {SAMPLE_ITEMS.map((i) => (
                    <div key={i.name} className="mt-1">
                      <p className="break-words">{i.name}</p>
                      <div className="flex justify-between gap-2 tabular-nums">
                        <span>{i.qty} × {fmtRp(i.price)}</span>
                        <span>{fmtRp(i.qty * i.price)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="receipt-hr my-2" aria-hidden="true" />
                  <div className="flex justify-between tabular-nums"><span>Subtotal</span><span>{fmtRp(sample.subtotal)}</span></div>
                  {form.taxEnabled && (form.receiptShowTax ?? true) && <div className="flex justify-between tabular-nums"><span>Pajak{form.taxInclusive ? ' (inklusif)' : ''}</span><span>{fmtRp(sample.tax)}</span></div>}
                  <div className="flex justify-between font-bold tabular-nums"><span>TOTAL</span><span>{fmtRp(sample.total)}</span></div>
                  <div className="receipt-hr my-2" aria-hidden="true" />
                  {(form.receiptShowNote ?? true) && form.receiptHeader && <p className="text-center text-[10px]">{form.receiptHeader}</p>}
                  {(form.receiptShowNote ?? true) && form.receiptFooter && <p className="mt-1 text-center text-[10px]">{form.receiptFooter}</p>}
                </div>
              </div>
              <Button variant="ghost" className="mt-3 w-full" onClick={() => setPrintTest(true)}>
                <Printer className="size-4" /> Cetak Uji Coba
              </Button>
            </Card>
          </div>
        </div>
      )}

      {tab === 'pajak' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-3 xl:grid-cols-4">
            {[
              { label: 'Pajak Aktif', value: form.taxEnabled ? 'Ya' : 'Tidak', sub: 'Pajak sedang digunakan' },
              { label: 'Tarif Pajak', value: `${form.taxPct}%`, sub: form.taxName || 'Tarif pajak saat ini' },
              { label: 'Harga Sudah Termasuk Pajak', value: !hasExt ? '—' : form.taxInclusive ? 'Ya' : 'Tidak', sub: !hasExt ? 'Segera hadir' : form.taxInclusive ? 'Pajak di dalam harga' : 'Pajak di luar harga' },
              { label: 'Transaksi Kena Pajak Hari Ini', value: String(taxed), sub: `Dari ${trxTotal} transaksi` },
            ].map((k) => (
              <div key={k.label} className="min-w-0 rounded-2xl bg-cream p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-fog">{k.label}</p>
                <p className="mt-1 break-words text-xl font-medium tabular-nums text-fg sm:text-2xl">{k.value}</p>
                <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHead title="Pengaturan Pajak" sub="Atur konfigurasi pajak untuk transaksi di toko Anda." />
              <div className="space-y-4">
                {hasExt ? (
                <label className={LABEL_CLS}>
                  Nama Pajak
                  <input value={form.taxName ?? ''} onChange={(e) => setV('taxName', e.target.value.slice(0, 20))} placeholder="cth: PPN" maxLength={20} className={INPUT_CLS} />
                </label>
                ) : (
                <Soon>
                  <label className={LABEL_CLS}>
                    Nama Pajak
                    <input disabled className={INPUT_CLS} value="" placeholder="cth: PPN" onChange={() => {}} />
                  </label>
                </Soon>
                )}
                <NumInput allowDecimal label="Tarif Pajak (%)" value={form.taxPct} onValue={(r) => setForm((f) => (f ? { ...f, taxPct: r === '' ? 0 : Number(r.replace(',', '.')) } : f))} />
                {hasExt ? (
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-fg">
                  Harga Sudah Termasuk Pajak
                  <input type="checkbox" checked={!!form.taxInclusive} onChange={(e) => setV('taxInclusive', e.target.checked)} className="h-4 w-4 accent-jet" />
                </label>
                ) : (
                <Soon>
                  <label className="flex cursor-not-allowed items-center justify-between gap-3 text-sm text-fg">
                    Harga Sudah Termasuk Pajak
                    <input type="checkbox" disabled className="h-4 w-4 accent-jet" />
                  </label>
                </Soon>
                )}
                {hasExt ? (
                <label className={LABEL_CLS}>
                  Pembulatan Pajak
                  <Select value={form.taxRounding ?? 'none'} onChange={(e) => setV('taxRounding', e.target.value)}>
                    <option value="none">Normal (setengah ke atas)</option>
                    <option value="down">Ke bawah (floor)</option>
                    <option value="up">Ke atas (ceil)</option>
                  </Select>
                </label>
                ) : (
                <Soon>
                  <label className={LABEL_CLS}>
                    Pembulatan Pajak
                    <Select disabled value="" onChange={() => {}}>
                      <option value="">Menunggu backend</option>
                    </Select>
                  </label>
                </Soon>
                )}
                {hasExt ? (
                <label className={LABEL_CLS}>
                  Terapkan Pajak Pada
                  <Select value={form.taxApplyTo ?? 'all'} onChange={(e) => setV('taxApplyTo', e.target.value)}>
                    <option value="all">Semua produk</option>
                  </Select>
                </label>
                ) : (
                <Soon>
                  <label className={LABEL_CLS}>
                    Terapkan Pajak Pada
                    <Select disabled value="" onChange={() => {}}>
                      <option value="">Menunggu backend</option>
                    </Select>
                  </label>
                </Soon>
                )}
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-fg">
                  Status Pajak
                  <input type="checkbox" checked={form.taxEnabled} onChange={(e) => setForm((f) => (f ? { ...f, taxEnabled: e.target.checked } : f))} className="h-4 w-4 accent-jet" />
                </label>
                <p className="-mt-2 text-xs text-fog">Aktifkan atau nonaktifkan perhitungan pajak.</p>
              </div>
              <FormActions dirty={dirty} busy={busy} onReset={resetForm} onSave={save} />
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHead title="Contoh Perhitungan Pajak" sub="Simulasi perhitungan pada transaksi." />
                {(() => {
                  const ex = calcTax(100000, form.taxPct, !!form.taxInclusive, form.taxRounding ?? 'none')
                  return (
                  <>
                  <div className="space-y-1 font-mono text-[13px] tabular-nums">
                    <div className="flex justify-between"><span className="font-sans text-muted">Harga Produk</span><span>{fmtRp(100000)}</span></div>
                    <div className="flex justify-between"><span className="font-sans text-muted">Pajak{form.taxName ? ` (${form.taxName} ${form.taxPct}%)` : ` (${form.taxPct}%)`}</span><span>{fmtRp(ex.tax)}</span></div>
                    <div className="my-2 border-t border-dashed border-dove" />
                    <div className="flex justify-between font-bold"><span className="font-sans">Total</span><span>{fmtRp(ex.total)}</span></div>
                  </div>
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface px-3.5 py-3 text-[13px] text-muted">
                    <Info className="mt-0.5 size-4 shrink-0 text-steel" aria-hidden="true" />
                    <p>{form.taxInclusive ? 'Harga sudah termasuk pajak: total tetap, pajak dihitung dari dalam harga.' : 'Karena harga belum termasuk pajak, maka pajak akan ditambahkan ke total transaksi.'}</p>
                  </div>
                  </>
                  )
                })()}
              </Card>
              <Card>
                <CardHead title="Aktivitas Pajak Terkini" sub="Log perubahan pengaturan pajak." />
                <p className="py-4 text-center text-sm text-fog">Belum ada aktivitas pengaturan.</p>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Modal open={manageOpen} title="Manage Passcode" onClose={() => { setManageOpen(false); setEditingId(null); setPcVal(''); setConfirmResetId(null) }}>
        <p className="mb-3 text-sm text-muted">Atur passcode 5 angka untuk admin dan setiap kasir. Akun tanpa passcode bisa langsung dipakai tanpa PIN.</p>
        {accountList.loading && manageUsers.length === 0 ? (
          <p className="py-4 text-center text-sm text-fog">Memuat daftar akun…</p>
        ) : manageUsers.length === 0 ? (
          <p className="py-4 text-center text-sm text-fog">{accountList.err || 'Daftar akun tidak tersedia.'}</p>
        ) : (
          <div className="space-y-2">
            {manageUsers.map((u) => (
              <div key={u.id} className="rounded-lg border border-dove px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                    {u.name} <span className="font-normal text-fog">· {u.role === 'admin' ? 'Admin' : 'Kasir'}</span>
                  </span>
                  <Pill tone={u.has_passcode ? 'ok' : 'muted'}>{u.has_passcode ? 'Aktif' : 'Mati'}</Pill>
                  {editingId === u.id ? (
                    <button onClick={() => { setEditingId(null); setPcVal('') }} className="text-[13px] text-muted hover:underline">Batal</button>
                  ) : (
                    <button onClick={() => { setEditingId(u.id); setPcVal(''); setConfirmResetId(null); setErr('') }} disabled={pcBusy} className="text-[13px] font-medium text-jet hover:underline disabled:opacity-40">
                      {u.has_passcode ? 'Ubah' : 'Tambah'}
                    </button>
                  )}
                  {u.has_passcode && editingId !== u.id && (
                    confirmResetId === u.id ? (
                      <>
                        <button onClick={() => clearPc(u)} disabled={pcBusy} className="text-[13px] font-medium text-ember hover:underline disabled:opacity-40">
                          {pcBusy ? '…' : 'Yakin, hapus'}
                        </button>
                        <button onClick={() => setConfirmResetId(null)} className="text-[13px] text-muted hover:underline">Batal</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmResetId(u.id)} disabled={pcBusy} className="text-[13px] font-medium text-ember hover:underline disabled:opacity-40">
                        Hapus
                      </button>
                    )
                  )}
                </div>
                {editingId === u.id && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <input
                      value={pcVal}
                      onChange={(e) => setPcVal(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      inputMode="numeric"
                      placeholder="•••••"
                      aria-label={`Passcode baru untuk ${u.name}`}
                      autoFocus
                      className="min-w-0 flex-1 rounded-md border border-border bg-paper px-3 py-2.5 text-center font-mono text-lg tracking-[0.5em] focus:border-jet focus:outline-none"
                    />
                    <Button onClick={() => savePc(u)} disabled={pcBusy || pcVal.length !== 5}>{pcBusy ? '…' : 'Simpan'}</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={printTest} title="Cetak Uji Coba" onClose={() => setPrintTest(false)}>
        {form && <Receipt trx={sampleTrx} settings={form} onClose={() => setPrintTest(false)} />}
      </Modal>
    </>
  )
}

