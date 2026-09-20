import { useState } from 'react'
import { Link } from 'react-router'
import { Download } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'

const REPO = '0xMinomus/OpenPOS'
const RELEASES_URL = `https://github.com/${REPO}/releases`

function WinIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" role="img">
      <title>Windows</title>
      <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
    </svg>
  )
}

function AndroidIcon({ className = 'size-[18px]' }: { className?: string }) {
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
    <div className="landing-light bg-bg text-fg">
      <Navbar logoTone="light" />
      <main>
        <section className="pt-[clamp(48px,7vw,96px)] pb-14 md:pb-20">
          <div className="mx-auto max-w-[600px] px-5 md:px-8">
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-steel">Unduh</p>
            <h1 className="mx-auto mt-5 text-center text-[clamp(34px,5vw,52px)] font-medium leading-[1.06] tracking-[-0.03em] text-fg">
              Kasir offline,<br />di perangkat Anda.
            </h1>
            <p className="mx-auto mt-5 max-w-[460px] text-center text-[15px] leading-relaxed text-muted sm:text-base">
              Tanpa internet, tanpa langganan. Data tersimpan di perangkat sendiri.
            </p>

            <div className="mt-10 divide-y divide-dove rounded-2xl border border-dove bg-paper">
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fg/[0.04] text-jet">
                  <WinIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-fg">Windows</p>
                  <p className="mt-0.5 font-mono text-xs text-steel">10 / 11 · 64-bit · .exe</p>
                </div>
                <button
                  onClick={downloadWindows}
                  disabled={busyWin}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-jet px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-85 active:translate-y-px disabled:opacity-60"
                >
                  <Download className="size-4" />
                  {busyWin ? 'Menyiapkan…' : 'Unduh'}
                </button>
              </div>
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#3ddc84]/15 text-[#16a34a]">
                  <AndroidIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-fg">Android</p>
                  <p className="mt-0.5 font-mono text-xs text-steel">8.0+ · .apk</p>
                </div>
                <a
                  href="/openpos.apk"
                  download="OpenPOS.apk"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-dove px-5 py-2.5 text-sm font-medium text-fg transition hover:border-jet hover:text-jet active:translate-y-px"
                >
                  <Download className="size-4" />
                  Unduh
                </a>
              </div>
            </div>

            {dlErr && (
              <p className="mt-4 text-center text-[13px] text-ember">
                {dlErr} <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="font-medium text-jet underline underline-offset-4">Buka halaman rilis</a>.
              </p>
            )}

            <p className="mt-6 text-center font-mono text-xs leading-relaxed text-steel">
              gratis · offline · data milik Anda
            </p>
            <p className="mt-5 text-center text-[13px] leading-relaxed text-muted">
              Butuh data sinkron antar perangkat?{' '}
              <Link to="/daftar" className="font-medium text-jet underline decoration-dove underline-offset-4 hover:decoration-jet">
                Pakai OpenPOS Cloud
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
