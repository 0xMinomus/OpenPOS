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

type Busy = '' | 'win' | 'apk'

export default function Unduh() {
  const [busy, setBusy] = useState<Busy>('')
  const [err, setErr] = useState('')

  async function download(ext: RegExp, key: Busy) {
    if (busy) return
    setBusy(key)
    setErr('')
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      if (!res.ok) throw new Error(String(res.status))
      const rel = await res.json()
      const asset = (rel.assets ?? []).find((a: { name: string }) => ext.test(a.name))
      if (!asset?.browser_download_url) throw new Error('no-asset')
      window.location.href = asset.browser_download_url
    } catch {
      setErr('Gagal mengambil versi terbaru.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="landing-light bg-bg text-fg">
      <style>{`
        @keyframes ud-in { from { opacity: 0; transform: translateY(14px) scale(0.96); } to { opacity: 1; transform: none; } }
        .ud-logo { animation: ud-in 0.52s cubic-bezier(0.2,0,0,1) both; }
        .ud-logo--win { animation-delay: 0.06s; }
        .ud-logo--apk { animation-delay: 0.16s; }
        @media (prefers-reduced-motion: reduce) { .ud-logo { animation: none; } }
      `}</style>
      <Navbar logoTone="light" />
      <main>
        <section className="pt-[clamp(48px,7vw,96px)] pb-10 text-center md:pb-12">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <p className="font-mono text-[11px] tracking-[0.14em] text-steel uppercase">Unduh · OpenPOS</p>
            <h1 className="mx-auto mt-5 max-w-[560px] text-[clamp(36px,5.2vw,56px)] leading-[1.06] font-medium tracking-[-0.03em] text-jet">
              Unduh OpenPOS
              <br />
              untuk perangkat Anda.
            </h1>
            <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-relaxed text-muted sm:text-[16px]">
              Pasang OpenPOS di komputer kasir atau gunakan aplikasi Android untuk menjalankan bisnis Anda kapan saja. Semua data tersimpan aman di perangkat Anda.
            </p>
          </div>
        </section>

        <section className="pb-6">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              <div className="rounded-2xl border border-dove bg-paper px-7 py-7 md:px-8 md:py-8">
                <div className="flex items-center gap-3.5">
                  <span className="ud-logo ud-logo--win grid size-10 place-items-center rounded-xl border border-dove bg-bg text-jet">
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                      <path d="M3 3.5 12.2 2v9.4L3 12.2V3.5Zm9.6-1.4L21 1v10.2l-8.4.8V2.1ZM21 13.1V23l-8.4-1.1v-9.4l8.4.6ZM12.2 13.3v9.4L3 21.5v-8.8l9.2.6Z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-medium leading-none text-jet">OpenPOS untuk Windows</h2>
                    <p className="mt-1.5 text-[13px] leading-none text-muted">Windows 10/11 (64-bit) · Installer .exe</p>
                  </div>
                </div>
                <button
                  onClick={() => download(/\.exe$/i, 'win')}
                  disabled={!!busy}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-jet px-6 py-[15px] text-[14px] font-medium text-paper transition hover:bg-charcoal active:translate-y-px disabled:opacity-60"
                >
                  <Download className="size-4 shrink-0" />
                  {busy === 'win' ? 'Menyiapkan…' : 'Unduh untuk Windows'}
                </button>
              </div>

              <div className="rounded-2xl border border-dove bg-paper px-7 py-7 md:px-8 md:py-8">
                <div className="flex items-center gap-3.5">
                  <span className="ud-logo ud-logo--apk grid size-10 place-items-center rounded-xl border border-dove bg-bg text-jet">
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                      <path d="M6 18c0 .55.45 1 1 1h1v3.5a1 1 0 0 0 2 0V19h2v3.5a1 1 0 1 0 2 0V19h1c.55 0 1-.45 1-1v-7H6v7Zm10.5-11a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM8 8.25A1.25 1.25 0 1 0 8 10.75 1.25 1.25 0 0 0 8 8.25ZM4.5 8A2.5 2.5 0 0 0 2 10.5v4A2.5 2.5 0 0 0 4.5 17H6V8H4.5ZM18 8v9h1.5A2.5 2.5 0 0 0 22 14.5v-4A2.5 2.5 0 0 0 19.5 8H18ZM12 3.5 9.2 6h5.6L12 3.5ZM7 6.5 9.5 4A1 1 0 0 1 10.5 4h3a1 1 0 0 1 1 1l2.5 1.5A3.5 3.5 0 0 1 19 9.5V11H5V9.5A3.5 3.5 0 0 1 7 6.5Z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-medium leading-none text-jet">OpenPOS untuk Android</h2>
                    <p className="mt-1.5 text-[13px] leading-none text-muted">Android 8.0+ · APK resmi</p>
                  </div>
                </div>
                <button
                  onClick={() => download(/\.apk$/i, 'apk')}
                  disabled={!!busy}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-jet bg-transparent px-6 py-[15px] text-[14px] font-medium text-jet transition hover:bg-jet hover:text-paper active:translate-y-px disabled:opacity-60"
                >
                  <Download className="size-4 shrink-0" />
                  {busy === 'apk' ? 'Menyiapkan…' : 'Unduh untuk Android'}
                </button>
              </div>
            </div>

            {err && (
              <p className="mt-4 text-center text-[13px] text-ember">
                {err} <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="font-medium text-jet underline underline-offset-4">Buka halaman rilis</a>.
              </p>
            )}

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-[13px] text-muted">
              <ShieldCheck className="size-3.5 shrink-0 text-steel" />
              Aman & Terpercaya · Bebas virus · Update otomatis
            </p>
          </div>
        </section>

        <section className="pt-12 pb-14 md:pt-14 md:pb-16">
          <div className="mx-auto max-w-[1120px] px-5 md:px-8">
            <div className="rounded-2xl border border-dove bg-cream px-6 py-7 md:px-8 md:py-9">
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
