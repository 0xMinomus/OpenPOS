import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, apiListUsers, apiLogout, apiMe, apiSwitchAccount, hasToken, type User } from '../lib/api'
import { setSession, toSession, useDB } from '../lib/store'
import { DMA, PJS } from './login-icons'
import { LoginStory } from './login-story'
import Navbar from './Navbar'
import Footer from './Footer'

function initial(name: string) {
  const t = name.trim()
  return (t ? t[0] : '?').toUpperCase()
}

export default function PilihAkun() {
  const nav = useNavigate()
  const { session } = useDB()
  const [users, setUsers] = useState<User[] | null>(null)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<{ u: User; role: 'admin' | 'cashier' } | null>(null)
  const [pin, setPin] = useState('')

  useEffect(() => {
    let dead = false
    async function boot() {
      try {
        let s = session
        if (!s) {
          if (!hasToken()) { nav('/masuk', { replace: true }); return }
          const me = await apiMe()
          if (dead) return
          s = toSession(me.user)
          setSession(s)
        }
        if (s.role !== 'admin') { nav('/app', { replace: true }); return }
        const list = await apiListUsers()
        if (dead) return
        if (!list.some((u) => u.role === 'cashier' && u.active)) { nav('/app', { replace: true }); return }
        setUsers(list)
      } catch {
        if (!dead) nav('/app', { replace: true })
      }
    }
    boot()
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function pickAccount(u: User, role: 'admin' | 'cashier', code?: string) {
    setErr(''); setBusyId(u.id)
    try {
      const r = await apiSwitchAccount(u.id, code || undefined, role)
      setSession(toSession(r.user))
      nav('/app', { replace: true })
    } catch (x) {
      if (x instanceof ApiError && x.code === 'passcode_required') {
        setPending({ u, role }); setPin('')
      } else {
        setErr(x instanceof Error ? x.message : 'Gagal ganti akun.')
      }
    } finally {
      setBusyId(null)
    }
  }

  // has_passcode dari server: akun ber-PIN langsung ke form, sisanya masuk langsung.
  function tapAccount(u: User, role: 'admin' | 'cashier') {
    setErr('')
    if (u.has_passcode) { setPending({ u, role }); setPin('') }
    else pickAccount(u, role)
  }

  async function keluar() {
    await apiLogout()
    setSession(null)
    nav('/masuk', { replace: true })
  }

  const cashiers = (users ?? []).filter((u) => u.role === 'cashier')
  const adminUser = (users ?? []).find((u) => u.role === 'admin') ?? null

  return (
    <div className="min-h-screen bg-[#FFFEFA] flex flex-col">
      <Navbar logoTone="light" />
      <div className="w-full flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        {/* ── Panel kiri: pilih akun ────────────────────────── */}
        <div className="box-border w-full lg:w-[620px] shrink-0 bg-[#FFFEFA] relative order-1 flex flex-col justify-center py-10 lg:py-12">
          <div className="login-rise box-border w-full max-w-[440px] mx-auto px-6 lg:mx-0 lg:px-0 lg:max-w-none lg:ml-[90px] lg:mr-8 lg:w-[440px] flex flex-col gap-[22px]">
            <div className="flex flex-col gap-[9px]">
              <div className={`text-[12px]/[16px] text-[#2F6FEB] ${PJS} font-extrabold tracking-[1px] whitespace-nowrap`}>
                PILIH AKUN
              </div>
              <div className={`text-[clamp(30px,4vw,38px)]/[1.15] text-[#102033] ${DMA} font-normal`}>
                Masuk sebagai siapa?
              </div>
              <div className={`text-[15px]/[23px] text-[#667085] ${PJS} font-normal`}>
                Satu akun untuk tiap peran di toko Anda.
              </div>
            </div>

            {err && (
              <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
                {err}
              </p>
            )}

            {!users ? (
              <div className="flex flex-col gap-[12px]" aria-busy="true" aria-label="Memuat akun">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[68px] animate-pulse rounded-[14px] bg-[#F3EFE6]" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-[12px]">
                <button
                  onClick={() => adminUser && tapAccount(adminUser, 'admin')}
                  disabled={!adminUser || busyId === adminUser.id}
                  className="w-full min-h-[68px] flex items-center gap-4 p-4 rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-left transition-all duration-150 hover:outline-[#2F6FEB] hover:shadow-[0px_4px_14px_#2F6FEB22] active:scale-[0.99] disabled:opacity-50"
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-[#2F6FEB] text-white ${PJS} font-extrabold text-lg`} aria-hidden="true">
                    {initial(session?.name ?? adminUser?.name ?? 'A')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px]/[20px] text-[#102033] ${PJS} font-bold`}>{session?.name ?? adminUser?.name ?? 'Admin'}</span>
                    <span className={`block truncate text-[13px]/[18px] text-[#667085] ${PJS} font-medium`}>{session?.email ?? ''}</span>
                  </span>
                  {busyId === adminUser?.id
                    ? <span className="login-spin block w-[18px] h-[18px] shrink-0 rounded-full border-2 border-[#2F6FEB]/30 border-t-[#2F6FEB]" aria-hidden="true" />
                    : <span className={`shrink-0 rounded-full bg-[#E9F0FF] px-3 py-1 text-[12px]/[16px] text-[#2F6FEB] ${PJS} font-extrabold`}>Admin</span>}
                </button>

                {cashiers.map((u) => (
                  <button
                    key={u.id}
                    disabled={!u.active || busyId === u.id}
                    onClick={() => tapAccount(u, 'cashier')}
                    className="w-full min-h-[68px] flex items-center gap-4 p-4 rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-left transition-all duration-150 hover:outline-[#2F6FEB] hover:shadow-[0px_4px_14px_#2F6FEB22] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:outline-[#DDD7CB] disabled:hover:shadow-none"
                  >
                    <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-[#E9F0FF] text-[#2F6FEB] ${PJS} font-extrabold text-lg`} aria-hidden="true">
                      {initial(u.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15px]/[20px] text-[#102033] ${PJS} font-bold`}>{u.name}</span>
                      <span className={`block text-[13px]/[18px] text-[#667085] ${PJS} font-medium`}>Kasir</span>
                    </span>
                    {busyId === u.id
                      ? <span className="login-spin block w-[18px] h-[18px] shrink-0 rounded-full border-2 border-[#2F6FEB]/30 border-t-[#2F6FEB]" aria-hidden="true" />
                      : u.active
                        ? <span className={`shrink-0 text-[13px]/[18px] text-[#2F6FEB] ${PJS} font-bold whitespace-nowrap`}>Masuk →</span>
                        : <span className={`shrink-0 rounded-full bg-[#F3EFE6] px-3 py-1 text-[12px]/[16px] text-[#98A2B3] ${PJS} font-bold`}>Nonaktif</span>}
                  </button>
                ))}
              </div>
            )}

            {pending && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (pin.length === 5) pickAccount(pending.u, pending.role, pin) }}
                className="login-rise w-full flex flex-col gap-[16px]"
                noValidate
              >
                <div className={`text-[15px]/[23px] text-[#667085] ${PJS} font-normal`}>
                  <span className={`block text-[#102033] ${PJS} font-bold text-[15px]/[23px] mb-1`}>Akun ini dilindungi passcode.</span>
                  Akun <strong>{pending.u.name}</strong> memerlukan 5 angka untuk melanjutkan.
                </div>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                  placeholder="•••••" aria-label="Passcode 5 angka"
                  className="w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-center font-mono text-lg tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent"
                />
                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => { setPending(null); setPin('') }}
                    className={`flex-1 h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-[15px]/[20px] text-[#102033] ${PJS} font-bold hover:outline-[#2F6FEB]`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit" disabled={pin.length !== 5 || busyId === pending.u.id}
                    className={`flex-1 h-[54px] rounded-[14px] bg-[#2F6FEB] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold hover:brightness-110 disabled:opacity-50`}
                  >
                    {busyId === pending.u.id ? 'Memproses…' : 'Masuk'}
                  </button>
                </div>
              </form>
            )}

            <button onClick={keluar} className={`mx-auto w-fit text-[14px]/[19px] text-[#667085] ${PJS} font-medium hover:underline`}>
              Keluar dari sesi ini
            </button>
          </div>

          <div className="hidden lg:flex absolute left-[180px] bottom-[28px] flex-row gap-[7px] items-center">
            <span className={`text-[12px]/[16px] text-[#7C8B9E] ${PJS} font-medium whitespace-nowrap`}>
              Data Anda dienkripsi dan tersimpan aman.
            </span>
          </div>
          <p className={`lg:hidden text-center px-6 pb-10 text-[12px]/[16px] text-[#7C8B9E] ${PJS} font-medium`}>
            Data Anda dienkripsi dan tersimpan aman.
          </p>
        </div>

        {/* ── Panel kanan: story (komponen bersama dengan /masuk) ── */}
        <LoginStory />
      </div>
      <Footer />
    </div>
  )
}
