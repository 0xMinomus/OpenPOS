import { Fragment, useState } from 'react'
import { Link } from 'react-router'
import { Download, Monitor, Smartphone, ShieldCheck } from 'lucide-react'
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
                  <span className="grid size-10 place-items-center rounded-xl border border-dove bg-bg text-jet">
                    <Monitor className="size-[18px]" />
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
                  <span className="grid size-10 place-items-center rounded-xl border border-dove bg-bg text-jet">
                    <Smartphone className="size-[18px]" />
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
