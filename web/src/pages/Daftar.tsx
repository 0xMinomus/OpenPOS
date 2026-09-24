import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { apiGetSettings, apiGoogleLogin, apiHasActiveCashiers, apiRegister, apiSendOtp, apiSetPasscode, apiUpdateSettings, apiVerifyOtp, apiMe, ApiError, type User } from '../lib/api'
import { setSession, toSession } from '../lib/store'
import { GoogleButton } from '../lib/google'
import { DMA, LoginIcon, PJS } from './login-icons'
import { SignupStory } from './login-story'
import Navbar from './Navbar'
import Footer from './Footer'

const STEPS = [
  { n: 1, label: 'Akun' },
  { n: 2, label: 'Verifikasi' },
  { n: 3, label: 'Toko' },
  { n: 4, label: 'Selesai' },
]

function Spinner({ light }: { light?: boolean }) {
  return (
    <span
      className={`login-spin block w-[18px] h-[18px] shrink-0 rounded-full border-2 ${light ? 'border-white/40 border-t-white' : 'border-[#2F6FEB]/30 border-t-[#2F6FEB]'}`}
      aria-hidden="true"
    />
  )
}

export default function Daftar() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'choice' | 'email' | 'google-onboard' | 'google-pin'>('choice')
  const [googleUser, setGoogleUser] = useState<User | null>(null)
  const [googleCred, setGoogleCred] = useState('')
  const [googlePin, setGooglePin] = useState('')
  const [gisErr, setGisErr] = useState('')
  const handleGisError = useCallback((msg: string) => setGisErr(msg), [])
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agree, setAgree] = useState(false)
  const [store, setStore] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const [code, setCode] = useState('')
  const [otpMsg, setOtpMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Datang dari halaman Masuk setelah Google login akun baru:
  // sesi + token sudah tersimpan, tinggal lengkapi nama toko + passcode.
  useEffect(() => {
    if (params.get('google') !== 'onboard' || googleUser) return
    apiMe()
      .then((r) => {
        setSession(toSession(r.user))
        setGoogleUser(r.user)
        setStore(r.user.store_name)
        setMode('google-onboard')
        setStep(3)
      })
      .catch(() => nav('/masuk', { replace: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendOtp() {
    const em = email.trim().toLowerCase()
    setOtpMsg(''); setErr(''); setCode('')
    try {
      await apiSendOtp(em)
      setOtpMsg(`Kode OTP 6 digit terkirim ke ${em}.`)
      setCooldown(60)
    } catch (x) {
      if (x instanceof ApiError && x.status === 429) setCooldown(60)
      setOtpMsg('')
      setErr(x instanceof Error ? x.message : 'Gagal mengirim kode. Coba lagi.')
      throw x
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return setErr('Masukkan kode OTP 6 digit.')
    setErr(''); setBusy(true)
    try {
      await apiVerifyOtp(email.trim().toLowerCase(), code)
      setStep(3)
    } catch (x) {
      if (x instanceof ApiError && (x.status === 410 || x.status === 429)) setCooldown(0)
      setErr(x instanceof Error ? x.message : 'Kode salah. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!store.trim()) return setErr('Nama toko wajib diisi.')
    if (step === 3) {
      setStep(4)
      return
    }
    if (!/^\d{5}$/.test(passcode)) return setErr('Passcode harus 5 angka.')
    if (passcode !== confirm) return setErr('Passcode tidak cocok.')
    setBusy(true)
    try {
      const r = await apiRegister(name.trim(), email.trim().toLowerCase(), password, store.trim())
      setSession(toSession(r.user))
      try {
        await apiSetPasscode(r.user.id, passcode, 'admin')
      } catch {
        // passcode bukan penghalang masuk; gagal disimpan ditangani halaman Pengaturan
      }
      nav('/app', { replace: true })
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Gagal mendaftar. Coba lagi.')
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  function step1Next(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!name.trim()) return setErr('Nama wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('Masukkan alamat email yang valid.')
    if (password.length < 8) return setErr('Kata sandi minimal 8 karakter.')
    if (!agree) return setErr('Centang persetujuan Syarat Layanan dan Kebijakan Privasi untuk lanjut.')
    setBusy(true)
    sendOtp()
      .then(() => setStep(2))
      .catch(() => {})
      .finally(() => setBusy(false))
  }

  async function handleGoogle(credential: string) {
    setErr(''); setGisErr(''); setBusy(true)
    try {
      const r = await apiGoogleLogin(credential)
      setSession(toSession(r.user))
      // Akun yang baru dibuat detik ini → lengkapi nama toko + passcode.
      // Akun lama (Google dipakai untuk masuk) → langsung ke dashboard.
      const age = r.user.created_at ? Date.now() - new Date(r.user.created_at).getTime() : Infinity
      if (age < 2 * 60 * 1000) {
        setGoogleUser(r.user)
        setStore(r.user.store_name)
        setMode('google-onboard')
        setStep(3)
      } else {
        nav((await apiHasActiveCashiers()) ? '/pilih-akun' : '/app', { replace: true })
      }
    } catch (x) {
      if (x instanceof ApiError && x.code === 'passcode_required') {
        // Akun Google ber-passcode: minta PIN, ulangi dengan credential sama.
        setGoogleCred(credential)
        setMode('google-pin')
        setErr('')
      } else {
        setErr(x instanceof Error ? x.message : 'Login Google gagal. Coba lagi.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function submitGooglePasscode(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const r = await apiGoogleLogin(googleCred, undefined, googlePin)
      setSession(toSession(r.user))
      const age = r.user.created_at ? Date.now() - new Date(r.user.created_at).getTime() : Infinity
      if (age < 2 * 60 * 1000) {
        setGoogleUser(r.user)
        setStore(r.user.store_name)
        setMode('google-onboard')
        setStep(3)
      } else {
        nav((await apiHasActiveCashiers()) ? '/pilih-akun' : '/app', { replace: true })
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Passcode salah. Coba lagi.')
      setGooglePin('')
    } finally {
      setBusy(false)
    }
  }

  async function submitGoogle(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!store.trim()) return setErr('Nama toko wajib diisi.')
    if (step === 3) {
      setStep(4)
      return
    }
    if (!/^\d{5}$/.test(passcode)) return setErr('Passcode harus 5 angka.')
    if (passcode !== confirm) return setErr('Passcode tidak cocok.')
    if (!googleUser) return setErr('Sesi Google tidak valid. Ulangi dari awal.')
    setBusy(true)
    try {
      if (store.trim() !== googleUser.store_name) {
        const cur = await apiGetSettings()
        await apiUpdateSettings({ ...cur, storeName: store.trim() })
      }
      await apiSetPasscode(googleUser.id, passcode, 'admin')
      nav('/app', { replace: true })
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Gagal menyimpan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEFA] flex flex-col">
      <Navbar logoTone="light" />
      <div className="w-full flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <SignupStory />

        {/* ── Panel kanan: form auth ────────────────────────── */}
        <div className="box-border w-full lg:w-[680px] shrink-0 bg-[#FFFEFA] relative order-2 flex flex-col justify-center py-10 lg:py-12">
          <div className="login-rise box-border w-full max-w-[440px] mx-auto px-6 lg:mx-0 lg:px-0 lg:max-w-none lg:ml-[120px] lg:mr-8 lg:w-[440px] flex flex-col gap-[18px]">
            <div className="flex flex-col gap-[8px]">
              <div className={`text-[12px]/[16px] text-[#2F6FEB] ${PJS} font-extrabold tracking-[1px] whitespace-nowrap`}>
                BUAT AKUN OPENPOS
              </div>
              <div className={`text-[clamp(30px,4vw,38px)]/[1.15] text-[#102033] ${DMA} font-normal`}>
                Buat toko Anda hari ini
              </div>
              <div className={`text-[15px]/[23px] text-[#667085] ${PJS} font-normal`}>
                Satu akun untuk admin dan kasir. Gratis, tanpa kartu kredit.
              </div>
            </div>

            {mode !== 'choice' && (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2" aria-label="Langkah pendaftaran">
                {STEPS.map((s, i) => (
                  <div key={s.n} className={`flex items-center gap-1.5 text-[11px] ${PJS} font-bold ${step >= s.n ? 'text-[#2F6FEB]' : 'text-[#98A2B3]'}`}>
                    {i > 0 && <span className="h-px w-3.5 bg-[#DDD7CB]" aria-hidden="true" />}
                    <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${step >= s.n ? 'bg-[#2F6FEB] text-white' : 'outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px]'}`} aria-hidden="true">
                      {step > s.n ? (
                        <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6.2 4.8 9 10 3.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : s.n}
                    </span>
                    {s.label}
                  </div>
                ))}
              </div>
            )}

            {err && (
              <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
                {err}
              </p>
            )}

            {mode === 'choice' && (
              <>
                <div className={`login-pop relative w-full h-[52px] rounded-[14px] outline outline-1 outline-offset-[-0.5px] transition-all duration-150 ${busy ? 'outline-[#2F6FEB] bg-[#E9F0FF]/60' : 'outline-[#DDD7CB] hover:outline-[#2F6FEB] hover:shadow-[0px_4px_14px_#2F6FEB22] active:scale-[0.99]'}`} style={{ animationDelay: '60ms' }}>
                  <div className="absolute inset-0 flex flex-row gap-[12px] justify-center items-center pointer-events-none" aria-hidden="true">
                    {busy ? (
                      <Spinner />
                    ) : (
                      <span className={`text-[17px]/[23px] text-[#4285F4] ${PJS} font-extrabold whitespace-nowrap`}>G</span>
                    )}
                    <span className={`text-[14px]/[19px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>
                      {busy ? 'Menghubungkan ke Google…' : 'Daftar dengan Google'}
                    </span>
                  </div>
                  <div className={`absolute inset-0 overflow-hidden rounded-[14px] opacity-0 [&>div]:h-full ${busy ? 'pointer-events-none' : 'cursor-pointer'}`}>
                    <GoogleButton onToken={handleGoogle} busy={busy} text="signup_with" fill onError={handleGisError} />
                  </div>
                </div>
                {gisErr && (
                  <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
                    {gisErr} <button type="button" onClick={() => window.location.reload()} className="font-bold underline">Muat ulang</button>
                  </p>
                )}

                <div className="w-full flex flex-row gap-[12px] items-center" aria-hidden="true">
                  <div className="flex-1 h-[1px] bg-[#DDD7CB]" />
                  <div className={`text-[12px]/[16px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>atau isi data singkat</div>
                  <div className="flex-1 h-[1px] bg-[#DDD7CB]" />
                </div>

                <button
                  onClick={() => { setErr(''); setGisErr(''); setMode('email') }}
                  className={`w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-[15px]/[20px] text-[#102033] ${PJS} font-bold transition-all duration-150 hover:outline-[#2F6FEB] hover:shadow-[0px_4px_14px_#2F6FEB22] active:scale-[0.99]`}
                >
                  Daftar dengan Email
                </button>
              </>
            )}

            {mode === 'google-pin' && (
              <form onSubmit={submitGooglePasscode} className="login-rise w-full flex flex-col gap-[16px]" noValidate>
                <div className={`text-[13px]/[19px] text-[#667085] ${PJS} font-medium bg-[#F3EFE6] rounded-[14px] px-4 py-3`}>
                  Akun Google ini dilindungi passcode. Masukkan 5 angka untuk melanjutkan.
                </div>
                <label className="w-full flex flex-col gap-[8px]">
                  <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Passcode</span>
                  <input
                    value={googlePin}
                    onChange={(e) => setGooglePin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    type="password" inputMode="numeric" autoFocus
                    placeholder="•••••"
                    className="w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-center font-mono text-lg tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => { setMode('choice'); setGoogleCred(''); setGooglePin(''); setErr('') }}
                    className={`flex-1 h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-[15px]/[20px] text-[#102033] ${PJS} font-bold hover:outline-[#2F6FEB]`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit" disabled={googlePin.length !== 5 || busy}
                    className={`flex-1 h-[54px] rounded-[14px] bg-[#2F6FEB] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold hover:brightness-110 disabled:opacity-50`}
                  >
                    Masuk
                  </button>
                </div>
              </form>
            )}

            {mode === 'email' && step === 1 && (
              <form onSubmit={step1Next} className="login-rise w-full flex flex-col gap-[13px]" noValidate>
                <label className="w-full flex flex-col gap-[7px]">
                  <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Nama Anda</span>
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    type="text" autoComplete="name" placeholder="Nama pemilik toko"
                    className={`w-full h-[50px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] px-4 text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3] bg-transparent focus:outline-[#2F6FEB]`}
                  />
                </label>
                <label className="w-full flex flex-col gap-[7px]">
                  <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Email</span>
                  <span className="w-full h-[50px] flex flex-row p-[0px_16px] items-center rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] focus-within:outline-2">
                    <LoginIcon name="mail" size={18} className="shrink-0" />
                    <input
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      type="email" autoComplete="email" placeholder="nama@tokosaya.com"
                      className={`ml-3 flex-1 min-w-0 bg-transparent outline-none text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3]`}
                    />
                  </span>
                  <span className={`text-xs font-normal text-[#98A2B3] ${PJS}`}>Dipakai untuk masuk dan verifikasi kode OTP. Tidak dibagikan.</span>
                </label>
                <label className="w-full flex flex-col gap-[7px]">
                  <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Kata sandi</span>
                  <span className="w-full h-[50px] flex flex-row gap-[10px] p-[0px_16px] items-center rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] focus-within:outline-2">
                    <LoginIcon name="lock" size={18} className="shrink-0" />
                    <input
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Minimal 8 karakter"
                      className={`flex-1 min-w-0 bg-transparent outline-none text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3]`}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="shrink-0">
                      <LoginIcon name="eye" size={18} style={{ opacity: showPw ? 1 : 0.55 }} />
                    </button>
                  </span>
                </label>

                <button type="button" onClick={() => setAgree((v) => !v)} className="w-full flex flex-row gap-[10px] items-start text-left" aria-pressed={agree}>
                  <span className={`mt-[1px] w-[18px] h-[18px] shrink-0 rounded-[5px] grid place-items-center ${agree ? 'bg-[#2F6FEB]' : 'bg-[#E9F0FF] outline outline-1 outline-[#2F6FEB] outline-offset-[-0.5px]'}`} aria-hidden="true">
                    {agree && (
                      <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 6.2 4.8 9 10 3.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </span>
                  <span className={`text-[12px]/[17px] text-[#667085] ${PJS} font-medium`}>Saya menyetujui Syarat Layanan dan Kebijakan Privasi.</span>
                </button>

                <button
                  type="submit" disabled={busy}
                  className={`w-full h-[54px] flex flex-row gap-[10px] justify-center items-center bg-[#2F6FEB] rounded-[14px] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:opacity-50`}
                >
                  {busy ? (
                    <>
                      <Spinner light />
                      Mengirim kode…
                    </>
                  ) : (
                    <>
                      Lanjutkan
                      <LoginIcon name="arrow-right" size={18} className="shrink-0" />
                    </>
                  )}
                </button>
                <button type="button" onClick={() => { setErr(''); setMode('choice') }} className={`text-center text-[13px] text-[#667085] ${PJS} hover:underline`}>
                  Kembali
                </button>
              </form>
            )}

            {mode === 'email' && step === 2 && (
              <form onSubmit={verifyOtp} className="login-rise w-full flex flex-col gap-[13px]" noValidate>
                <div className={`text-[13px]/[19px] text-[#667085] ${PJS} font-medium bg-[#F3EFE6] rounded-[14px] px-4 py-3`}>
                  {otpMsg || 'Mengirim kode OTP…'}
                  <span className="mt-1 block text-xs">Kode berlaku 10 menit dan hanya bisa dicoba 3 kali.</span>
                  <span className="mt-2 block text-xs">
                    Belum menerima kode? Jika email ini sudah terdaftar,{' '}
                    <Link to="/masuk" className="font-bold text-[#2F6FEB] hover:underline">masuk di sini</Link>.
                  </span>
                </div>
                <label className="w-full flex flex-col gap-[7px]">
                  <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Kode OTP</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                    placeholder="••••••"
                    className="w-full h-[50px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-center font-mono text-xl tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent"
                  />
                </label>
                <button
                  type="submit" disabled={code.length !== 6 || busy}
                  className={`w-full h-[54px] flex flex-row gap-[10px] justify-center items-center bg-[#2F6FEB] rounded-[14px] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:opacity-50`}
                >
                  {busy ? (
                    <>
                      <Spinner light />
                      Memverifikasi…
                    </>
                  ) : 'Verifikasi Email'}
                </button>
                <button
                  type="button"
                  onClick={() => sendOtp().catch(() => {})}
                  disabled={cooldown > 0 || busy}
                  className={`text-center text-[13px] text-[#667085] ${PJS} hover:underline disabled:opacity-50`}
                >
                  {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim ulang kode'}
                </button>
              </form>
            )}

            {(mode === 'email' || mode === 'google-onboard') && step >= 3 && (
              <form onSubmit={mode === 'google-onboard' ? submitGoogle : submit} className="login-rise w-full flex flex-col gap-[13px]" noValidate>
                {step === 3 && (
                  <>
                    <label className="w-full flex flex-col gap-[7px]">
                      <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Nama toko</span>
                      <span className="w-full h-[50px] flex flex-row gap-[10px] p-[0px_16px] items-center rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] focus-within:outline-2">
                        <LoginIcon name="store" size={18} className="shrink-0" />
                        <input
                          value={store} onChange={(e) => setStore(e.target.value)}
                          type="text" placeholder="Contoh: Kedai Bu Ayu"
                          className={`flex-1 min-w-0 bg-transparent outline-none text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3]`}
                        />
                      </span>
                      <span className={`text-xs font-normal text-[#98A2B3] ${PJS}`}>Ditampilkan di struk dan dashboard.</span>
                    </label>
                    <button
                      type="submit"
                      className={`w-full h-[54px] flex flex-row gap-[10px] justify-center items-center bg-[#2F6FEB] rounded-[14px] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-[0.99]`}
                    >
                      Lanjutkan
                      <LoginIcon name="arrow-right" size={18} className="shrink-0" />
                    </button>
                  </>
                )}
                {step === 4 && (
                  <>
                    <div className={`text-[13px]/[19px] text-[#667085] ${PJS} font-medium bg-[#F3EFE6] rounded-[14px] px-4 py-3`}>
                      Terakhir, buat <strong className="text-[#102033]">passcode 5 angka</strong> untuk akun admin Anda. Passcode dipakai saat berpindah akun di toko.
                    </div>
                    <label className="w-full flex flex-col gap-[7px]">
                      <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Passcode admin</span>
                      <input
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        type="password" inputMode="numeric" autoComplete="new-password" autoFocus
                        placeholder="•••••"
                        className="w-full h-[50px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-center font-mono text-lg tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent"
                      />
                    </label>
                    <label className="w-full flex flex-col gap-[7px]">
                      <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Ulangi passcode</span>
                      <input
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        type="password" inputMode="numeric" autoComplete="new-password"
                        placeholder="•••••"
                        className="w-full h-[50px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-center font-mono text-lg tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent"
                      />
                    </label>
                    <button
                      type="submit" disabled={!store.trim() || busy}
                      className={`w-full h-[54px] flex flex-row gap-[10px] justify-center items-center bg-[#2F6FEB] rounded-[14px] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:opacity-50`}
                    >
                      {busy ? (
                        <>
                          <Spinner light />
                          {mode === 'google-onboard' ? 'Menyimpan…' : 'Membuat akun…'}
                        </>
                      ) : (mode === 'google-onboard' ? 'Selesai' : 'Buat Akun')}
                    </button>
                  </>
                )}
              </form>
            )}

            <div className="w-full flex flex-row gap-[5px] justify-center items-center">
              <span className={`text-[14px]/[19px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>Sudah punya akun?</span>
              <Link to="/masuk" className={`text-[14px]/[19px] text-[#2F6FEB] ${PJS} font-extrabold whitespace-nowrap hover:underline`}>
                Masuk
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex absolute left-[209px] bottom-[28px] flex-row gap-[7px] items-center">
            <LoginIcon name="shield-check" size={15} className="shrink-0" />
            <span className={`text-[12px]/[16px] text-[#7C8B9E] ${PJS} font-medium whitespace-nowrap`}>
              Data Anda dienkripsi dan tersimpan aman.
            </span>
          </div>
          <p className={`lg:hidden text-center px-6 pb-10 text-[12px]/[16px] text-[#7C8B9E] ${PJS} font-medium`}>
            Data Anda dienkripsi dan tersimpan aman.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
