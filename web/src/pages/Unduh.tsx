import { Fragment, useState } from 'react'
import { Link } from 'react-router'
import { Download, ShieldCheck } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'

const REPO = '0xMinomus/OpenPOS-Test'
const RELEASES_URL = `https://github.com/${REPO}/releases`

const STEPS = [
  { n: '01', t: 'Unduh installer', d: 'Pilih versi sesuai perangkat Anda.' },
  { n: '02', t: 'Pasang & buat akun', d: 'Ikuti proses instalasi dan daftar akun.' },
  { n: '03', t: 'Mulai gunakan', d: 'Tambahkan produk dan mulai bertransaksi.' },
]

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
      <style>{`
        @keyframes ud-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ud-pop { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: none; } }
        .ud-reveal { opacity: 0; animation: ud-rise 0.6s cubic-bezier(0.2,0,0,1) both; }
        .ud-1 { animation-delay: 0.05s; }
        .ud-2 { animation-delay: 0.12s; }
        .ud-3 { animation-delay: 0.19s; }
        .ud-4 { animation-delay: 0.26s; }
        .ud-5 { animation-delay: 0.33s; }
        .ud-6 { animation-delay: 0.4s; }
        .ud-logo { opacity: 0; animation: ud-pop 0.45s cubic-bezier(0.2,0,0,1) both; }
        .ud-logo--win { animation-delay: 0.34s; }
        .ud-logo--apk { animation-delay: 0.41s; }
        @media (prefers-reduced-motion: reduce) { .ud-reveal, .ud-logo { animation: none; opacity: 1; } }
      `}</style>
      <Navbar logoTone="light" />
      <main>
        <section className="pt-[clamp(48px,7vw,96px)] pb-10 text-center md:pb-12">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <p className="ud-reveal ud-1 font-mono text-[11px] tracking-[0.14em] text-steel uppercase">Unduh · OpenPOS</p>
            <h1 className="ud-reveal ud-2 mx-auto mt-5 max-w-[560px] text-[clamp(36px,5.2vw,56px)] leading-[1.06] font-medium tracking-[-0.03em] text-jet">
              Unduh OpenPOS
              <br />
              untuk perangkat Anda.
            </h1>
            <p className="ud-reveal ud-3 mx-auto mt-5 max-w-[620px] text-[15px] leading-relaxed text-muted sm:text-[16px]">
              Pasang OpenPOS di komputer kasir atau gunakan aplikasi Android untuk menjalankan bisnis Anda kapan saja. Semua data tersimpan aman di perangkat Anda.
            </p>
          </div>
        </section>

        <section className="pb-6">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              <div className="ud-reveal ud-4 rounded-2xl border border-dove bg-paper px-7 py-7 md:px-8 md:py-8">
                <div className="flex items-center gap-3.5">
                  <span className="ud-logo ud-logo--win grid size-10 place-items-center rounded-xl border border-dove bg-bg text-jet">
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true" role="img">
                      <title>Windows</title>
                      <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-medium leading-none text-jet">OpenPOS untuk Windows</h2>
                    <p className="mt-1.5 text-[13px] leading-none text-muted">Windows 10/11 (64-bit) · Installer .exe</p>
                  </div>
                </div>
                <button
                  onClick={downloadWindows}
                  disabled={busyWin}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-jet px-6 py-[15px] text-[14px] font-medium text-paper transition hover:bg-charcoal active:translate-y-px disabled:opacity-60"
                >
                  <Download className="size-4 shrink-0" />
                  {busyWin ? 'Menyiapkan…' : 'Unduh untuk Windows'}
                </button>
              </div>

              <div className="ud-reveal ud-5 rounded-2xl border border-dove bg-paper px-7 py-7 md:px-8 md:py-8">
                <div className="flex items-center gap-3.5">
                  <span className="ud-logo ud-logo--apk grid size-10 place-items-center rounded-xl border border-dove bg-bg text-jet">
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true" role="img">
                      <title>Android</title>
                      <path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-medium leading-none text-jet">OpenPOS untuk Android</h2>
                    <p className="mt-1.5 text-[13px] leading-none text-muted">Android 8.0+ · APK resmi</p>
                  </div>
                </div>
                <a
                  href="/openpos.apk"
                  download="OpenPOS.apk"
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-jet bg-transparent px-6 py-[15px] text-[14px] font-medium text-jet transition hover:bg-jet hover:text-paper active:translate-y-px"
                >
                  <Download className="size-4 shrink-0" />
                  Unduh untuk Android
                </a>
              </div>
            </div>

            {dlErr && (
              <p className="mt-4 text-center text-[13px] text-ember">
                {dlErr} <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="font-medium text-jet underline underline-offset-4">Buka halaman rilis</a>.
              </p>
            )}

            <p className="ud-reveal ud-6 mt-6 flex items-center justify-center gap-2 text-center text-[13px] text-muted">
              <ShieldCheck className="size-3.5 shrink-0 text-steel" />
              Aman & Terpercaya · Bebas virus · Update otomatis
            </p>
          </div>
        </section>

        <section className="pt-12 pb-14 md:pt-14 md:pb-16">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <div className="ud-reveal ud-6 rounded-2xl border border-dove bg-cream px-6 py-7 md:px-8 md:py-9">
              <h2 className="text-[15px] font-medium tracking-tight text-jet">Mulai dalam tiga langkah</h2>
              <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
                {STEPS.map((s, idx) => (
                  <Fragment key={s.n}>
                    <div className="flex gap-3.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dove bg-paper font-mono text-[11px] font-medium tracking-wide text-steel">
                        {s.n}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[14px] font-medium leading-none text-jet">{s.t}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.d}</p>
                      </div>
                    </div>
                    {idx < STEPS.length - 1 && <div aria-hidden className="mx-6 w-px self-stretch bg-dove" />}
                  </Fragment>
                ))}
              </div>
              <div className="grid gap-0 md:hidden">
                {STEPS.map((s, idx) => (
                  <div key={s.n}>
                    <div className="flex gap-4 py-1">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dove bg-paper font-mono text-[11px] font-medium tracking-wide text-steel">
                        {s.n}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[14px] font-medium leading-none text-jet">{s.t}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.d}</p>
                      </div>
                    </div>
                    {idx < STEPS.length - 1 && <div aria-hidden className="my-4 h-px bg-dove" />}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[13px] text-muted">
              Butuh data tersinkron otomatis antar perangkat?{' '}
              <Link to="/daftar" className="font-medium text-jet underline decoration-dove underline-offset-4 hover:decoration-jet">
                Coba OpenPOS Cloud
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
