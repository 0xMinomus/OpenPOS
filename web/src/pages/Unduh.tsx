import { useState } from 'react'
import { Link } from 'react-router'
import { DMA, LoginIcon, PJS } from './login-icons'
import Navbar from './Navbar'
import Footer from './Footer'

const REPO = '0xMinomus/OpenPOS'
const RELEASES_URL = `https://github.com/${REPO}/releases`

function WinIcon({ className = 'size-[27px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" role="img">
      <title>Windows</title>
      <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
    </svg>
  )
}

function AndroidIcon({ className = 'size-[29px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" role="img">
      <title>Android</title>
      <path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z" />
    </svg>
  )
}

export default function Unduh() {
  const [busyWin, setBusyWin] = useState(false)
  const [dlErr, setDlErr] = useState('')

  async function downloadWindows() {
    if (busyWin) return
    setBusyWin(true)
    setDlErr('')
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`)
      if (!res.ok) throw new Error(String(res.status))
      const rels = await res.json()
      const list = Array.isArray(rels) ? rels : [rels]
      let url = ''
      for (const rel of list) {
        const asset = (rel.assets ?? []).find((a: { name: string }) => /\.exe$/i.test(a.name))
        if (asset?.browser_download_url) { url = asset.browser_download_url; break }
      }
      if (!url) throw new Error('no-asset')
      window.location.href = url
    } catch {
      setDlErr('Gagal mengambil versi terbaru.')
    } finally {
      setBusyWin(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEFA] flex flex-col">
      <Navbar logoTone="light" />
      <div className="w-full flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        {/* ── Panel kiri: story offline (di mobile tampil setelah tombol unduh) ── */}
        <div className="box-border flex-1 bg-[#FFFEFA] relative overflow-hidden order-2 lg:order-1 border-t border-[#DDD7CB] lg:border-t-0 lg:border-r flex flex-col justify-center px-[clamp(24px,5vw,64px)] py-12">
          <div className="absolute right-[-100px] top-[60px] w-[390px] h-[390px] bg-[#E9F0FF] rounded-full" aria-hidden="true" />
          <div className="w-full max-w-[632px] flex flex-col gap-[24px] relative">
            <div className="login-rise flex flex-col gap-[18px]">
              <div className="flex flex-row gap-[12px] items-center">
                <span className="w-[28px] h-[2px] bg-[#2F6FEB] rounded-[2px]" aria-hidden="true" />
                <span className={`text-[12px] text-[#2F6FEB] ${PJS} font-bold tracking-[1.5px] whitespace-nowrap`}>OPENPOS OFFLINE</span>
              </div>
              <div className={`text-[clamp(44px,5vw,66px)]/[1.02] text-[#102033] ${DMA} font-normal tracking-[-0.03em]`} style={{ animationDelay: '60ms' }}>
                Tetap buka.
                <br />
                <span className="text-[#2F6FEB]">Meski offline.</span>
              </div>
              <div className={`text-[17px]/[26px] max-w-[500px] text-[#667085] ${PJS} font-normal`}>
                Semua transaksi tersimpan langsung di perangkat. Internet kembali, bisnis tetap berjalan seperti biasa.
              </div>
              <div className="w-fit flex flex-row flex-wrap gap-x-[24px] gap-y-[10px] items-center">
                <span className="w-fit flex flex-row gap-[8px] items-center">
                  <LoginIcon name="shield-check" size={16} className="shrink-0" style={{ filter: 'brightness(0.35)' }} />
                  <span className={`text-[13px] text-[#102033] ${PJS} font-semibold whitespace-nowrap`}>Data tetap privat</span>
                </span>
                <span className="w-fit flex flex-row gap-[8px] items-center">
                  <LoginIcon name="badge-dollar-sign" size={16} className="shrink-0" />
                  <span className={`text-[13px] text-[#102033] ${PJS} font-semibold whitespace-nowrap`}>Tanpa langganan</span>
                </span>
              </div>
            </div>

            <div className={`login-rise text-[clamp(72px,10vw,140px)]/[1] text-[#E4ECFF] ${DMA} font-bold tracking-[-0.04em] whitespace-nowrap select-none`} aria-hidden="true" style={{ animationDelay: '140ms' }}>
              OFFLINE
            </div>

            <div className="login-rise w-full" style={{ animationDelay: '200ms' }}>
              <div className="w-full h-[1px] bg-[#DDD7CB]" aria-hidden="true" />
              <div className="mt-[26px] flex flex-wrap items-center gap-x-8 gap-y-5">
                <div className="flex items-center gap-[18px]">
                  <span className="relative grid place-items-center w-[48px] h-[48px] shrink-0 rounded-full bg-[#E9F0FF]" aria-hidden="true">
                    <span className="w-[22px] h-[22px] bg-[#2F6FEB] rounded-full" />
                    <LoginIcon name="wifi-off" size={14} className="absolute" />
                  </span>
                  <span className="flex flex-col">
                    <span className={`text-[10px] text-[#667085] ${PJS} font-bold tracking-[1.1px] whitespace-nowrap`}>STATUS PERANGKAT</span>
                    <span className={`text-[18px] text-[#102033] ${DMA} font-bold whitespace-nowrap`}>Siap tanpa internet</span>
                    <span className={`text-[11px] text-[#667085] ${PJS} font-normal whitespace-nowrap`}>Transaksi tersimpan otomatis di perangkat.</span>
                  </span>
                </div>
                <div className="hidden sm:block w-[1px] h-[54px] bg-[#DDD7CB]" aria-hidden="true" />
                <div className="flex items-center gap-4">
                  <span className={`text-[28px] text-[#2F6FEB] ${DMA} font-bold tracking-[-0.03em]`}>100%</span>
                  <span className="flex flex-col gap-[6px]">
                    <span className="w-[7px] h-[7px] bg-[#D9F28E] rounded-full" aria-hidden="true" />
                    <span className={`text-[10px] text-[#102033] ${PJS} font-bold tracking-[0.8px] whitespace-nowrap`}>DATA LOKAL</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel kanan: pilih perangkat (di mobile tampil duluan) ── */}
        <div className="box-border w-full lg:w-[680px] shrink-0 bg-[#F3EFE6] relative order-1 lg:order-2 flex flex-col justify-center px-[clamp(24px,4vw,56px)] py-12">
          <div className="w-full max-w-[568px] flex flex-col gap-[14px] relative">
            <div className="login-rise flex flex-col gap-[12px]">
              <div className="flex flex-row gap-[9px] items-center">
                <span className="w-[26px] h-[2px] bg-[#2F6FEB] rounded-[2px]" aria-hidden="true" />
                <span className={`text-[12px] text-[#2F6FEB] ${PJS} font-bold tracking-[1.4px] whitespace-nowrap`}>UNDUH APLIKASI</span>
              </div>
              <div className={`text-[clamp(32px,4vw,42px)]/[1.08] text-[#102033] ${DMA} font-normal tracking-[-0.025em]`}>
                Pilih perangkat.
                <br />
                Langsung mulai.
              </div>
              <div className={`text-[15px]/[23px] max-w-[510px] text-[#667085] ${PJS} font-normal`}>
                Satu aplikasi kasir yang cepat, privat, dan siap dipakai, bahkan tanpa koneksi internet.
              </div>
            </div>

            <div className="login-rise flex flex-col gap-[14px]" style={{ animationDelay: '100ms' }}>
              <div className="w-full flex flex-col sm:flex-row gap-4 p-[20px] items-stretch sm:items-center bg-[#FFFEFA] outline outline-1 outline-[#BBD0FF] outline-offset-[-0.5px] rounded-[18px] shadow-[0px_8px_24px_#1020330D]">
                <span className="hidden sm:grid w-[52px] h-[52px] shrink-0 place-items-center bg-[#E9F0FF] rounded-[15px] text-[#2964F2]" aria-hidden="true">
                  <WinIcon />
                </span>
                <span className="min-w-0 flex-1 flex flex-col gap-[6px]">
                  <span className={`text-[18px] text-[#102033] ${DMA} font-bold whitespace-nowrap`}>Windows</span>
                  <span className={`text-[11px] text-[#667085] ${PJS} font-semibold tracking-[0.4px] whitespace-nowrap`}>WINDOWS 10 / 11 • 64-BIT • .EXE</span>
                  <span className={`text-[12px]/[17px] text-[#667085] ${PJS} font-normal`}>Installer resmi. Terpasang seperti aplikasi desktop biasa.</span>
                </span>
                <button
                  onClick={downloadWindows}
                  disabled={busyWin}
                  className={`w-full sm:w-[116px] shrink-0 h-[44px] flex flex-row gap-[8px] justify-center items-center bg-[#2F6FEB] rounded-[12px] text-[13px] text-white ${PJS} font-bold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60`}
                >
                  {busyWin ? 'Menyiapkan…' : (
                    <>
                      <LoginIcon name="download" size={16} className="shrink-0" />
                      Unduh
                    </>
                  )}
                </button>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-4 p-[20px] items-stretch sm:items-center bg-[#FFFEFA] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] rounded-[18px] shadow-[0px_8px_24px_#1020330D]">
                <span className="hidden sm:grid w-[52px] h-[52px] shrink-0 place-items-center bg-[#EAF8EE] rounded-[15px] text-[#16a34a]" aria-hidden="true">
                  <AndroidIcon />
                </span>
                <span className="min-w-0 flex-1 flex flex-col gap-[6px]">
                  <span className={`text-[18px] text-[#102033] ${DMA} font-bold whitespace-nowrap`}>Android</span>
                  <span className={`text-[11px] text-[#667085] ${PJS} font-semibold tracking-[0.4px] whitespace-nowrap`}>ANDROID 8.0+ • .APK</span>
                  <span className={`text-[12px]/[17px] text-[#667085] ${PJS} font-normal`}>Unduh APK resmi lalu izinkan instalasi saat pertama kali.</span>
                </span>
                <a
                  href="/openpos.apk"
                  download="OpenPOS.apk"
                  className={`w-full sm:w-[116px] shrink-0 h-[44px] flex flex-row gap-[8px] justify-center items-center bg-[#FFFEFA] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] rounded-[12px] text-[13px] text-[#102033] ${PJS} font-bold whitespace-nowrap transition-all duration-150 hover:outline-[#2F6FEB] active:scale-[0.98]`}
                >
                  <LoginIcon name="download" size={16} className="shrink-0" style={{ filter: 'brightness(0.2)' }} />
                  Unduh
                </a>
              </div>
            </div>

            {dlErr && (
              <p role="alert" className={`text-[13px]/[19px] text-[#B42318] ${PJS} font-medium bg-[#FDECEA] rounded-[14px] px-4 py-3`}>
                {dlErr} <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="font-bold underline">Buka halaman rilis</a>.
              </p>
            )}

            <Link
              to="/daftar"
              className="login-rise w-full flex flex-row gap-[14px] p-[15px_16px] items-center bg-[#EBE7DC] rounded-[14px] transition-all duration-150 hover:brightness-[0.98] active:scale-[0.995]"
              style={{ animationDelay: '180ms' }}
            >
              <span className="w-[38px] h-[38px] shrink-0 grid place-items-center bg-[#FFFEFA] rounded-[11px]" aria-hidden="true">
                <LoginIcon name="cloud" size={19} />
              </span>
              <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span className={`text-[12px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>Butuh sinkron antar perangkat?</span>
                <span className={`text-[11px] text-[#667085] ${PJS} font-normal whitespace-nowrap`}>Gunakan OpenPOS Cloud kapan pun bisnis Anda siap.</span>
              </span>
              <LoginIcon name="arrow-up-right" size={18} className="shrink-0" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
