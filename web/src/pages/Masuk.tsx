import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError, apiGoogleLogin, apiHasActiveCashiers, apiLogin, apiResetPassword, apiSendOtp, apiSendPasswordResetOtp, apiVerifyPasswordResetOtp } from '../lib/api'
import { setSession, toSession } from '../lib/store'
import { GoogleButton } from '../lib/google'
import { LoginIcon } from './login-icons'
import Navbar from './Navbar'

const BARS = [
  { d: 'Sen', h: 58, hot: false },
  { d: 'Sel', h: 84, hot: false },
  { d: 'Rab', h: 70, hot: false },
  { d: 'Kam', h: 108, hot: false },
  { d: 'Jum', h: 94, hot: false },
  { d: 'Sab', h: 116, hot: true },
  { d: 'Min', h: 102, hot: false },
]

const DMA = "font-['DM_Sans',system-ui,sans-serif]"
const PJS = "font-['Plus_Jakarta_Sans',system-ui,sans-serif]"

export default function Masuk() {
  const nav = useNavigate()
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('op_login_email') ?? '' } catch { return '' }
  })
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(() => {
    try { return !!localStorage.getItem('op_login_email') } catch { return false }
  })
  const [passcode, setPasscode] = useState('')
  const [needPasscode, setNeedPasscode] = useState(false)
  const [otp, setOtp] = useState('')
  const [needOtp, setNeedOtp] = useState(false)
  const [otpMsg, setOtpMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [googleCred, setGoogleCred] = useState('')
  const [googlePin, setGooglePin] = useState('')
  const [forgot, setForgot] = useState(false)
  const [fEmail, setFEmail] = useState('')
  const [fOtp, setFOtp] = useState('')
  const [fPw1, setFPw1] = useState('')
  const [fPw2, setFPw2] = useState('')
  const [fMsg, setFMsg] = useState('')
  const [fDone, setFDone] = useState(false)
  // Langkah lupa-sandi: email → otp (6 digit saja) → newpw (sandi baru).
  // OTP divalidasi server saat reset (submit akhir); langkah otp hanya
  // memastikan format 6 digit sebelum form sandi ditampilkan.
  const [fStep, setFStep] = useState<'email' | 'otp' | 'newpw'>('email')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // "Ingat saya" = ingat email saja (prefill). Token tetap per-tab
  // sessionStorage — tidak ada sesi abadi lintas browser ditutup.
  async function afterLogin(user: Parameters<typeof toSession>[0]) {
    setSession(toSession(user))
    try {
      if (remember) localStorage.setItem('op_login_email', email.trim().toLowerCase())
      else localStorage.removeItem('op_login_email')
    } catch { /* storage diblokir — abaikan */ }
    nav((await apiHasActiveCashiers()) ? '/pilih-akun' : '/app', { replace: true })
  }

  async function sendLoginOtp() {
    const em = email.trim().toLowerCase()
    setOtpMsg(''); setErr(''); setOtp('')
    try {
      await apiSendOtp(em, 'login')
      setOtpMsg(`Kode OTP 6 digit terkirim ke ${em}.`)
      setCooldown(60)
    } catch (x) {
      if (x instanceof ApiError && x.status === 429) {
        setCooldown(60)
        setOtpMsg('')
        setErr('Terlalu sering meminta kode. Tunggu 60 detik lalu kirim ulang.')
        return
      }
      setOtpMsg('')
      setErr(x instanceof Error ? x.message : 'Gagal mengirim kode. Coba lagi.')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const em = email.trim().toLowerCase()
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setErr('Masukkan alamat email yang valid.')
    if (!password) return setErr('Kata sandi wajib diisi.')
    setErr(''); setBusy(true)
    try {
      const r = await apiLogin(em, password)
      await afterLogin(r.user)
    } catch (x) {
      if (x instanceof ApiError && x.code === 'otp_required') {
        // Faktor kedua = OTP email (passcode tetap untuk pilih akun/switch).
        setNeedOtp(true)
        setErr('')
        sendLoginOtp()
      } else if (x instanceof ApiError && x.code === 'passcode_required') {
        // Backend lama belum dukung OTP login — fallback form PIN.
        setNeedPasscode(true)
        setErr('')
      } else if (x instanceof ApiError && x.status === 429) {
        setErr('Terlalu sering mencoba masuk. Tunggu sebentar lalu coba lagi.')
      } else {
        setErr(x instanceof Error ? x.message : 'Gagal masuk. Coba lagi.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return setErr('Masukkan kode OTP 6 digit.')
    setErr(''); setBusy(true)
    try {
      const r = await apiLogin(email.trim().toLowerCase(), password, { otp })
      await afterLogin(r.user)
    } catch (x) {
      if (x instanceof ApiError && (x.status === 410 || x.status === 429)) setCooldown(0)
      if (x instanceof ApiError && x.code === 'otp_wrong') setOtp('')
      if (x instanceof ApiError && x.status === 429) {
        setErr('Terlalu banyak percobaan. Tunggu sebentar lalu kirim ulang kode.')
      } else {
        setErr(x instanceof Error ? x.message : 'Kode salah. Coba lagi.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function sendForgotOtp() {
    const em = (fEmail || email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setErr('Masukkan alamat email yang valid.')
    setFEmail(em); setErr(''); setFMsg(''); setFOtp(''); setFDone(false)
    setBusy(true)
    try {
      await apiSendPasswordResetOtp(em)
      setFMsg(`Jika ${em} terdaftar, kode OTP 6 digit terkirim ke email tersebut.`)
      setFStep('otp')
      setCooldown(60)
    } catch (x) {
      if (x instanceof ApiError && x.status === 429) {
        setCooldown(60)
        setFMsg('')
        setErr('Terlalu sering meminta kode. Tunggu 60 detik lalu kirim ulang.')
        return
      }
      setFMsg('')
      setErr(x instanceof Error ? x.message : 'Gagal mengirim kode. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  // Langkah 2 → 3: verifikasi OTP ke server bila endpoint tersedia;
  // backend lama (404) = lanjut langsung, error asli muncul di reset.
  async function submitForgotOtp(e: React.FormEvent) {
    e.preventDefault()
    if (fOtp.length !== 6) return setErr('Masukkan kode OTP 6 digit.')
    setErr(''); setBusy(true)
    try {
      await apiVerifyPasswordResetOtp(fEmail, fOtp)
      setFStep('newpw')
    } catch (x) {
      if (x instanceof ApiError && x.status === 404) {
        // Endpoint belum live — fallback perilaku lama.
        setFStep('newpw')
        return
      }
      if (x instanceof ApiError && (x.status === 410 || x.status === 429)) setCooldown(0)
      if (x instanceof ApiError && x.status === 400) setFOtp('')
      setErr(x instanceof Error ? x.message : 'Kode salah. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault()
    if (fPw1.length < 8) return setErr('Kata sandi baru minimal 8 karakter.')
    if (fPw1 !== fPw2) return setErr('Konfirmasi kata sandi tidak cocok.')
    setErr(''); setBusy(true)
    try {
      await apiResetPassword(fEmail, fOtp, fPw1)
      setFDone(true)
      setFMsg('Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.')
      setEmail(fEmail); setPassword('')
    } catch (x) {
      if (x instanceof ApiError && (x.status === 410 || x.status === 429)) setCooldown(0)
      if (x instanceof ApiError && (x.status === 400 || x.status === 410 || x.status === 429)) {
        // Kode salah/kedaluwarsa/limit — balik ke langkah OTP agar user
        // kirim ulang atau masukkan ulang tanpa kehilangan email.
        setFOtp(''); setFStep('otp')
      }
      setErr(x instanceof Error ? x.message : 'Gagal mengganti kata sandi.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPasscode(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const r = await apiLogin(email.trim().toLowerCase(), password, { passcode })
      await afterLogin(r.user)
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Passcode salah. Coba lagi.')
      setPasscode('')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle(credential: string) {
    setErr(''); setBusy(true)
    try {
      const r = await apiGoogleLogin(credential)
      // Akun yang baru dibuat detik ini → lengkapi nama toko + passcode.
      // Akun lama (Google dipakai untuk masuk) → langsung ke dashboard.
      const age = r.user.created_at ? Date.now() - new Date(r.user.created_at).getTime() : Infinity
      setSession(toSession(r.user))
      if (age < 2 * 60 * 1000) {
        nav('/daftar?google=onboard', { replace: true })
      } else {
        nav((await apiHasActiveCashiers()) ? '/pilih-akun' : '/app', { replace: true })
      }
    } catch (x) {
      if (x instanceof ApiError && x.code === 'passcode_required') {
        // Akun Google ber-passcode: minta PIN, ulangi dengan credential sama.
        setGoogleCred(credential)
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
        nav('/daftar?google=onboard', { replace: true })
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

  function startForgot() {
    setForgot(true); setFEmail(email); setFStep('email')
    setFMsg(''); setFDone(false); setFOtp(''); setFPw1(''); setFPw2(''); setErr('')
  }

  return (
    <div className="min-h-screen bg-[#FFFEFA] flex flex-col">
      <Navbar logoTone="light" />
      <div className="w-full flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── Panel kiri: form auth ─────────────────────────── */}
        <div className="box-border w-full lg:w-[620px] shrink-0 bg-[#FFFEFA] relative order-1 flex flex-col justify-center py-10 lg:py-12">
          <div className="login-rise box-border w-full max-w-[440px] mx-auto px-6 lg:mx-0 lg:px-0 lg:max-w-none lg:ml-[90px] lg:mr-8 lg:w-[440px] flex flex-col gap-[22px]">
            <div className="flex flex-col gap-[9px]">
              <div className={`text-[12px]/[16px] text-[#2F6FEB] ${PJS} font-extrabold tracking-[1px] whitespace-nowrap`}>
                MASUK KE OPENPOS
              </div>
              <div className={`text-[clamp(30px,4vw,38px)]/[1.15] text-[#102033] ${DMA} font-normal`}>
                Selamat datang kembali
              </div>
              <div className={`text-[15px]/[23px] text-[#667085] ${PJS} font-normal`}>
                {forgot ? 'Atur ulang kata sandi akun Anda.' : 'Lanjutkan kelola toko Anda dari terakhir kali.'}
              </div>
            </div>

            {forgot ? (
              <ForgotBody
                fStep={fStep} fEmail={fEmail} setFEmail={setFEmail} fOtp={fOtp} setFOtp={setFOtp}
                fPw1={fPw1} setFPw1={setFPw1} fPw2={fPw2} setFPw2={setFPw2}
                fMsg={fMsg} fDone={fDone} err={err} busy={busy} cooldown={cooldown}
                sendForgotOtp={sendForgotOtp} submitForgotOtp={submitForgotOtp} submitForgot={submitForgot}
                back={() => { setForgot(false); setFMsg(''); setFDone(false); setFStep('email'); setErr('') }}
              />
            ) : needPasscode ? (
              <CodeBody
                title="Akun ini dilindungi passcode."
                desc={<>Akun <strong>{email.trim().toLowerCase()}</strong> memerlukan 5 angka untuk melanjutkan.</>}
                value={passcode} setValue={setPasscode} len={5} label="Passcode"
                err={err} busy={busy} submit={submitPasscode} submitLabel="Masuk"
                back={() => { setNeedPasscode(false); setErr('') }} backLabel="Kembali"
              />
            ) : needOtp ? (
              <CodeBody
                title="Verifikasi kode OTP."
                desc={<>{otpMsg || 'Mengirim kode OTP…'}<span className="mt-1 block text-xs">Kode berlaku 10 menit dan hanya bisa dicoba 3 kali.</span></>}
                value={otp} setValue={setOtp} len={6} label="Kode OTP"
                err={err} busy={busy} submit={submitOtp} submitLabel={busy ? 'Memverifikasi…' : 'Masuk'}
                back={() => { setNeedOtp(false); setOtp(''); setOtpMsg(''); setErr('') }} backLabel="Kembali"
                resend={sendLoginOtp} cooldown={cooldown}
              />
            ) : googleCred ? (
              <CodeBody
                title="Akun Google ini dilindungi passcode."
                desc="Masukkan 5 angka untuk melanjutkan."
                value={googlePin} setValue={setGooglePin} len={5} label="Passcode"
                err={err} busy={busy} submit={submitGooglePasscode} submitLabel="Masuk"
                back={() => { setGoogleCred(''); setGooglePin(''); setErr('') }} backLabel="Batal"
              />
            ) : (
              <>
                {/* Tombol Google kustom + lapisan GIS transparan full-cover di atasnya.
                    Klik di mana pun = klik tombol Google asli (visual pointer-events-none). */}
                <div className={`login-pop relative w-full h-[52px] rounded-[14px] outline outline-1 outline-offset-[-0.5px] transition-all duration-150 ${busy ? 'outline-[#2F6FEB] bg-[#E9F0FF]/60' : 'outline-[#DDD7CB] hover:outline-[#2F6FEB] hover:shadow-[0px_4px_14px_#2F6FEB22] active:scale-[0.99]'}`} style={{ animationDelay: '60ms' }}>
                  <div className="absolute inset-0 flex flex-row gap-[12px] justify-center items-center pointer-events-none" aria-hidden="true">
                    {busy ? (
                      <span className="login-spin block w-[18px] h-[18px] shrink-0 rounded-full border-2 border-[#2F6FEB]/30 border-t-[#2F6FEB]" />
                    ) : (
                      <span className={`text-[17px]/[23px] text-[#4285F4] ${PJS} font-extrabold whitespace-nowrap`}>G</span>
                    )}
                    <span className={`text-[14px]/[19px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>
                      {busy ? 'Menghubungkan ke Google…' : 'Masuk dengan Google'}
                    </span>
                  </div>
                  <div className={`absolute inset-0 overflow-hidden rounded-[14px] opacity-0 [&>div]:h-full ${busy ? 'pointer-events-none' : 'cursor-pointer'}`}>
                    <GoogleButton onToken={handleGoogle} busy={busy} text="signin_with" fill />
                  </div>
                </div>

                <div className="w-full flex flex-row gap-[12px] items-center" aria-hidden="true">
                  <div className="flex-1 h-[1px] bg-[#DDD7CB]" />
                  <div className={`text-[12px]/[16px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>atau gunakan email</div>
                  <div className="flex-1 h-[1px] bg-[#DDD7CB]" />
                </div>

                {err && (
                  <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
                    {err}
                  </p>
                )}

                <form onSubmit={submit} className="w-full flex flex-col gap-[16px]" noValidate>
                  <label className="w-full flex flex-col gap-[8px]">
                    <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Email</span>
                    <span className="w-full h-[54px] flex flex-row p-[0px_16px] items-center rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] focus-within:outline-2">
                      <LoginIcon name="mail" size={18} className="shrink-0" />
                      <input
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        type="text" autoComplete="username" placeholder="nama@tokosaya.com"
                        className={`ml-3 flex-1 min-w-0 bg-transparent outline-none text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3]`}
                      />
                    </span>
                  </label>
                  <div className="w-full flex flex-col gap-[8px]">
                    <div className="w-full flex flex-row justify-between items-center">
                      <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Kata sandi</span>
                      <button type="button" onClick={startForgot} className={`text-[13px]/[18px] text-[#2F6FEB] ${PJS} font-bold whitespace-nowrap hover:underline`}>
                        Lupa kata sandi?
                      </button>
                    </div>
                    <div className="w-full h-[54px] flex flex-row gap-[10px] p-[0px_16px] items-center rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] focus-within:outline-2">
                      <LoginIcon name="lock" size={18} className="shrink-0" />
                      <input
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                        className={`flex-1 min-w-0 bg-transparent outline-none text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3] ${showPw ? '' : 'tracking-[2px] font-semibold text-[15px]/[20px]'}`}
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="shrink-0">
                        <LoginIcon name="eye" size={18} style={{ opacity: showPw ? 1 : 0.55 }} />
                      </button>
                    </div>
                  </div>

                  <button type="button" onClick={() => setRemember((v) => !v)} className="w-fit flex flex-row gap-[10px] items-center" aria-pressed={remember}>
                    <span className={`w-[18px] h-[18px] rounded-[5px] grid place-items-center ${remember ? 'bg-[#2F6FEB]' : 'bg-[#E9F0FF] outline outline-1 outline-[#2F6FEB] outline-offset-[-0.5px]'}`} aria-hidden="true">
                      {remember && (
                        <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 6.2 4.8 9 10 3.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </span>
                    <span className={`text-[13px]/[18px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>Ingat saya di perangkat ini</span>
                  </button>

                  <button
                    type="submit" disabled={busy}
                    className={`w-full h-[54px] flex flex-row gap-[10px] justify-center items-center bg-[#2F6FEB] rounded-[14px] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:opacity-50`}
                  >
                    {busy ? (
                      <>
                        <span className="login-spin block w-[18px] h-[18px] shrink-0 rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                        Memproses…
                      </>
                    ) : (
                      <>
                        Masuk ke toko
                        <LoginIcon name="arrow-right" size={18} className="shrink-0" />
                      </>
                    )}
                  </button>
                </form>

                <div className="w-full flex flex-row gap-[5px] justify-center items-center">
                  <span className={`text-[14px]/[19px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>Belum punya akun?</span>
                  <Link to="/daftar" className={`text-[14px]/[19px] text-[#2F6FEB] ${PJS} font-extrabold whitespace-nowrap hover:underline`}>
                    Buat akun gratis
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="hidden lg:flex absolute left-[180px] bottom-[28px] flex-row gap-[7px] items-center">
            <LoginIcon name="shield-check" size={15} className="shrink-0" />
            <span className={`text-[12px]/[16px] text-[#7C8B9E] ${PJS} font-medium whitespace-nowrap`}>
              Data Anda dienkripsi dan tersimpan aman.
            </span>
          </div>
          <p className={`lg:hidden text-center px-6 pb-10 text-[12px]/[16px] text-[#7C8B9E] ${PJS} font-medium`}>
            Data Anda dienkripsi dan tersimpan aman.
          </p>
        </div>

        {/* ── Panel kanan: story ────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center flex-1 bg-[#10243B] relative overflow-hidden order-2 min-h-[480px] px-[clamp(24px,5vw,72px)] py-12">
          <div className="absolute right-[-116px] top-[-96px] w-[310px] h-[310px] opacity-[0.08] bg-white rounded-full" aria-hidden="true" />
          <div className="absolute right-[52px] bottom-[8px] w-[220px] h-[220px] opacity-[0.1] bg-[#D9F28E] rounded-full" aria-hidden="true" />

          <div className="w-full max-w-[676px] mx-auto flex flex-col gap-[36px]">
            <div className="login-rise flex flex-col gap-[22px]" style={{ animationDelay: '80ms' }}>
              <div className={`text-[clamp(40px,4vw,56px)]/[1.05] max-w-[620px] text-white ${DMA} font-semibold`}>
                Kembali ke ritme toko Anda.
              </div>
              <div className={`text-[18px]/[28px] max-w-[590px] text-[#C9D4E1] ${PJS} font-medium`}>
                Semua catatan kemarin sudah siap. Hari ini Anda tinggal melanjutkan langkah berikutnya.
              </div>
              <div className="w-fit flex flex-row gap-[22px] items-center">
                <span className="w-fit flex flex-row gap-[8px] items-center">
                  <LoginIcon name="cloud-check" size={17} className="shrink-0" />
                  <span className={`text-[14px]/[19px] text-[#E6EDF5] ${PJS} font-bold whitespace-nowrap`}>Tersimpan otomatis</span>
                </span>
                <span className="w-fit flex flex-row gap-[8px] items-center">
                  <LoginIcon name="clock-3" size={17} className="shrink-0" />
                  <span className={`text-[14px]/[19px] text-[#E6EDF5] ${PJS} font-bold whitespace-nowrap`}>Siap saat dibutuhkan</span>
                </span>
              </div>
            </div>

            <div className="login-pop relative w-full bg-[#143F9D] rounded-[28px] p-[26px_28px] shadow-[0px_18px_36px_#0A2A7138] outline outline-1 outline-[#FFFFFF24] outline-offset-[-0.5px]" style={{ animationDelay: '160ms' }}>
              <div className="flex items-start justify-between gap-3">
                <div className={`text-[11px]/[15px] text-[#BFD0FF] ${PJS} font-extrabold tracking-[1px] whitespace-nowrap pt-[10px]`}>
                  RITME 7 HARI TERAKHIR
                </div>
                <div className="w-fit shrink-0 flex flex-row gap-[8px] p-[11px_14px] items-center bg-[#FFFEFA] rounded-[18px] shadow-[0px_8px_18px_#0A2A7130]">
                  <LoginIcon name="package-check" size={17} className="shrink-0" />
                  <span className={`text-[12px]/[16px] text-[#274319] ${PJS} font-extrabold whitespace-nowrap`}>
                    Stok aman · 24 item
                  </span>
                </div>
              </div>
              <div className="mt-[6px] flex flex-row gap-[12px] items-center">
                <div className={`text-[34px]/[46px] text-white ${PJS} font-normal whitespace-nowrap`}>
                  Rp 18,6 jt
                </div>
                <div className="w-fit flex flex-row gap-[5px] p-[7px_10px] items-center bg-[#D9F28E] rounded-[14px]">
                  <LoginIcon name="trending-up" size={14} className="shrink-0" />
                  <span className={`text-[12px]/[16px] text-[#10243B] ${PJS} font-extrabold whitespace-nowrap`}>+12%</span>
                </div>
              </div>
              <div className={`mt-[2px] text-[12px]/[16px] text-[#BFD0FF] ${PJS} font-medium whitespace-nowrap`}>
                Penjualan mingguan
              </div>
              <div className="mt-[14px] w-full h-[150px] flex flex-row gap-[clamp(8px,2vw,16px)] items-end">
                {BARS.map((b, i) => (
                  <div key={b.d} className="flex-1 min-w-0 h-[142px] flex flex-col gap-[9px] justify-end items-center">
                    <div className={`login-bar w-full max-w-[40px] shrink-0 rounded-[10px_10px_4px_4px] ${b.hot ? 'bg-[#D9F28E]' : 'bg-[#6F9CFF]'}`} style={{ height: b.h, animationDelay: `${300 + i * 70}ms` }} />
                    <div className={`text-[11px]/[15px] ${b.hot ? 'text-white font-extrabold' : `text-[#BFD0FF] ${PJS} font-semibold`} ${PJS} whitespace-nowrap`}>
                      {b.d}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="border-t border-border px-4 py-8 text-[13px] text-muted sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1.5 text-center sm:flex-row sm:justify-between sm:text-left">
          <span>© 2026 OpenPOS</span>
          <span className="font-mono text-xs text-fog">gratis selamanya · untuk UMKM</span>
        </div>
      </footer>
    </div>
  )
}

/* ── Blok kode OTP / passcode / PIN (login OTP, PIN fallback, PIN Google) ── */
function CodeBody({ title, desc, value, setValue, len, label, err, busy, submit, submitLabel, back, backLabel, resend, cooldown }: {
  title: string; desc: React.ReactNode; value: string; setValue: (v: string) => void; len: number; label: string;
  err: string; busy: boolean; submit: (e: React.FormEvent) => void; submitLabel: string;
  back: () => void; backLabel: string; resend?: () => void; cooldown?: number;
}) {
  return (
    <>
      {err && (
        <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
          {err}
        </p>
      )}
      <form onSubmit={submit} className="login-rise w-full flex flex-col gap-[16px]" noValidate>
        <div className={`text-[15px]/[23px] text-[#667085] ${PJS} font-normal`}>
          <span className={`block text-[#102033] ${PJS} font-bold text-[15px]/[23px] mb-1`}>{title}</span>
          {desc}
        </div>
        <label className="w-full flex flex-col gap-[8px]">
          <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>{label}</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, len))}
            type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
            placeholder={len === 5 ? '•••••' : '••••••'}
            className={`w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] text-center font-mono ${len === 5 ? 'text-lg' : 'text-xl'} tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent`}
          />
        </label>
        <div className="flex gap-3">
          <button
            type="button" onClick={back}
            className={`flex-1 h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-[15px]/[20px] text-[#102033] ${PJS} font-bold hover:outline-[#2F6FEB]`}
          >
            {backLabel}
          </button>
          <button
            type="submit" disabled={value.length !== len || busy}
            className={`flex-1 h-[54px] rounded-[14px] bg-[#2F6FEB] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold hover:brightness-110 disabled:opacity-50`}
          >
            {submitLabel}
          </button>
        </div>
        {resend && (
          <button
            type="button" onClick={resend} disabled={(cooldown ?? 0) > 0 || busy}
            className={`text-center text-[13px] text-[#667085] ${PJS} hover:underline disabled:opacity-50`}
          >
            {(cooldown ?? 0) > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim ulang kode'}
          </button>
        )}
      </form>
    </>
  )
}

/* ── Blok lupa kata sandi 3 langkah ── */
function ForgotBody({ fStep, fEmail, setFEmail, fOtp, setFOtp, fPw1, setFPw1, fPw2, setFPw2, fMsg, fDone, err, busy, cooldown, sendForgotOtp, submitForgotOtp, submitForgot, back }: {
  fStep: 'email' | 'otp' | 'newpw'; fEmail: string; setFEmail: (v: string) => void;
  fOtp: string; setFOtp: (v: string) => void; fPw1: string; setFPw1: (v: string) => void;
  fPw2: string; setFPw2: (v: string) => void; fMsg: string; fDone: boolean;
  err: string; busy: boolean; cooldown: number;
  sendForgotOtp: () => void; submitForgotOtp: (e: React.FormEvent) => void; submitForgot: (e: React.FormEvent) => void;
  back: () => void;
}) {
  return (
    <>
      {err && (
        <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
          {err}
        </p>
      )}
      <form onSubmit={fStep === 'otp' ? submitForgotOtp : fStep === 'newpw' ? submitForgot : undefined} className="login-rise w-full flex flex-col gap-[16px]" noValidate>
        <div className={`text-[13px]/[19px] text-[#667085] ${PJS} font-medium bg-[#F3EFE6] rounded-[14px] px-4 py-3`}>
          {fDone ? fMsg : (fMsg || 'Masukkan email akun. Kode OTP 6 digit dikirim ke email tersebut.')}
          {!fDone && <span className="mt-1 block text-xs">Kode berlaku 10 menit dan hanya bisa dicoba 3 kali.</span>}
        </div>
        {fStep === 'email' && !fDone ? (
          <label className="w-full flex flex-col gap-[8px]">
            <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Email</span>
            <span className="w-full h-[54px] flex flex-row p-[0px_16px] items-center rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] focus-within:outline-[#2F6FEB] focus-within:outline-2">
              <LoginIcon name="mail" size={18} className="shrink-0" />
              <input
                value={fEmail} onChange={(e) => setFEmail(e.target.value)}
                type="text" autoComplete="username" autoFocus placeholder="nama@tokosaya.com"
                className={`ml-3 flex-1 min-w-0 bg-transparent outline-none text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3]`}
              />
            </span>
          </label>
        ) : fStep === 'otp' && !fDone ? (
          <label className="w-full flex flex-col gap-[8px]">
            <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Kode OTP</span>
            <input
              value={fOtp}
              onChange={(e) => setFOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
              placeholder="••••••"
              className="w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-center font-mono text-xl tracking-[0.5em] text-[#102033] placeholder:text-[#98A2B3] bg-transparent"
            />
          </label>
        ) : fStep === 'newpw' && !fDone ? (
          <>
            <label className="w-full flex flex-col gap-[8px]">
              <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Kata sandi baru</span>
              <input value={fPw1} onChange={(e) => setFPw1(e.target.value)} type="password" autoComplete="new-password" autoFocus placeholder="Minimal 8 karakter" className={`w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] px-4 text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3] bg-transparent`} />
            </label>
            <label className="w-full flex flex-col gap-[8px]">
              <span className={`text-[13px]/[18px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Konfirmasi kata sandi baru</span>
              <input value={fPw2} onChange={(e) => setFPw2(e.target.value)} type="password" autoComplete="new-password" placeholder="Ulangi kata sandi baru" className={`w-full h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] px-4 text-[14px]/[19px] text-[#102033] ${PJS} font-medium placeholder:text-[#98A2B3] bg-transparent`} />
            </label>
          </>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button" onClick={back}
            className={`flex-1 h-[54px] rounded-[14px] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] text-[15px]/[20px] text-[#102033] ${PJS} font-bold hover:outline-[#2F6FEB]`}
          >
            Kembali
          </button>
          {fStep === 'email' && !fDone ? (
            <button type="button" onClick={sendForgotOtp} disabled={busy} className={`flex-1 h-[54px] rounded-[14px] bg-[#2F6FEB] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold hover:brightness-110 disabled:opacity-50`}>{busy ? 'Mengirim…' : 'Kirim kode'}</button>
          ) : fStep === 'otp' && !fDone ? (
            <button type="submit" disabled={busy || fOtp.length !== 6} className={`flex-1 h-[54px] rounded-[14px] bg-[#2F6FEB] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold hover:brightness-110 disabled:opacity-50`}>{busy ? 'Memproses…' : 'Lanjut'}</button>
          ) : fStep === 'newpw' && !fDone ? (
            <button type="submit" disabled={busy || fPw1.length < 8 || fPw1 !== fPw2} className={`flex-1 h-[54px] rounded-[14px] bg-[#2F6FEB] shadow-[0px_8px_20px_#2F6FEB33] text-[15px]/[20px] text-white ${PJS} font-extrabold hover:brightness-110 disabled:opacity-50`}>{busy ? 'Memproses…' : 'Ubah kata sandi'}</button>
          ) : null}
        </div>
        {fMsg && !fDone && fStep === 'otp' && (
          <button
            type="button" onClick={sendForgotOtp} disabled={cooldown > 0 || busy}
            className={`text-center text-[13px] text-[#667085] ${PJS} hover:underline disabled:opacity-50`}
          >
            {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim ulang kode'}
          </button>
        )}
      </form>
    </>
  )
}
