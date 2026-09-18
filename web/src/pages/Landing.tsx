import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtRp } from '../lib/store'
import Footer from './Footer'
import Navbar from './Navbar'

const SALES7_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function randomSales7() {
  const base = 1500000 + Math.random() * 2500000
  return SALES7_DAYS.map((day, i) => ({
    day,
    omzet: Math.round((base + i * 150000 + Math.random() * 1800000 - 900000) / 1000) * 1000,
  }))
}

function SalesTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { day: string } }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-dove bg-paper px-2.5 py-1.5 font-mono text-xs text-fg shadow-sm">
      {payload[0].payload.day} · {fmtRp(payload[0].value)}
    </div>
  )
}

const TESTIMONIALS = [
  { initial: 'S', name: 'Bu Sari', role: 'Pemilik toko kelontong · Java', quote: 'Dulu omzet harian saya hitung dari buku kas setiap malam. Sekarang cukup buka dashboard. Stok langsung berkurang tiap transaksi dan struk tercetak otomatis, jadi saya tidak perlu pusing lagi.' },
  { initial: 'J', name: 'Pak Joko', role: 'Pemilik toko sembako · Surabaya', quote: 'Saya sudah tidak mencatat manual lagi. Sekarang tinggal buka ponsel, semua produk dan stok terlihat jelas. Kasir baru juga langsung bisa dipakai tanpa ribet.' },
  { initial: 'R', name: 'Bu Ratna', role: 'Pemilik toko kosmetik · Bandung', quote: 'Refund dulu membuat pusing. Sekarang cukup sekali klik dan stok kembali otomatis. Pelanggan juga senang karena struknya jelas dan rapi.' },
  { initial: 'B', name: 'Pak Bambang', role: 'Pemilik toko elektronik · Semarang', quote: 'Yang paling saya sukai adalah laporannya. Setiap malam saya bisa melihat produk mana yang laku dan mana yang harus diisi ulang, sehingga keputusan belanja lebih pasti.' },
  { initial: 'D', name: 'Bu Dewi', role: 'Pemilik toko pakaian · Yogyakarta', quote: 'Kasirnya cepat, pelanggan tidak menunggu lama saat toko ramai. Pembayaran QRIS, transfer, dan tunai tersedia semua, dan gratis pula.' },
  { initial: 'H', name: 'Pak Hendra', role: 'Pemilik minimarket · Makassar', quote: 'Karyawan saya diberi akses terbatas, hanya bisa bertransaksi. Data tetap aman dan saya masih bisa memantau omzet dari rumah.' },
  { initial: 'S', name: 'Bu Siti', role: 'Pemilik toko kelontong · Malang', quote: 'Dulu saya sering kehabisan stok tanpa sadar. Sekarang stok yang menipis langsung terlihat di dashboard, jadi saya bisa membeli barang sebelum habis.' },
  { initial: 'A', name: 'Pak Agus', role: 'Pemilik toko aksesoris · Denpasar', quote: 'Mudah dipelajari, orang awam seperti saya pun langsung bisa memakainya. Setiap transaksi tercatat otomatis dan tidak ada lagi uang yang terlewat.' },
  { initial: 'M', name: 'Bu Melati', role: 'Pemilik toko kosmetik · Medan', quote: 'Struk bisa dicetak atau dikirim digital. Pelanggan makin percaya dan toko terlihat profesional meskipun hanya toko kecil.' },
  { initial: 'R', name: 'Pak Rudi', role: 'Pemilik toko elektronik · Palembang', quote: 'Seminggu memakai, langsung terbiasa. Import produk dari Excel juga mudah, ratusan barang masuk sekaligus tanpa salah tulis.' },
]

export default function Landing() {
  const [sales7] = useState(randomSales7)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.15 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing-light bg-bg text-fg">
      <Navbar logoTone="light" />
      <main>
        <section id="beranda" className="overflow-hidden pt-[clamp(36px,5vw,92px)] pb-10">
          <div className="container mx-auto max-w-6xl px-5 md:px-8 text-center">
            <h1 className="hero-reveal mx-auto mt-8 text-[clamp(30px,8.5vw,40px)] font-normal leading-[1.08] tracking-[-0.025em] sm:text-[clamp(40px,5.2vw,60px)]">
              Aplikasi kasir gratis<br />untuk toko Anda.
            </h1>
            <p className="hero-reveal mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-muted sm:mt-6 sm:text-lg">
              Kelola produk, stok, dan penjualan dari satu dashboard sederhana. Tanpa biaya langganan, cocok untuk toko kecil dan menengah.
            </p>
            <div className="hero-reveal mt-6 flex flex-wrap justify-center gap-3 sm:mt-8">
              <Link to="/daftar" className="rounded-full bg-jet px-6 py-3 text-[15px] font-medium text-paper transition hover:bg-[color-mix(in_oklch,var(--t-jet)_82%,white)] active:translate-y-px sm:px-7.5 sm:py-3.5 sm:text-base">
                Buat toko pertama
              </Link>
              <Link to="/masuk" className="rounded-full border border-dove bg-transparent px-6 py-3 text-[15px] font-medium text-jet transition hover:border-jet hover:bg-fg/6 active:translate-y-px sm:px-7.5 sm:py-3.5 sm:text-base">
                Masuk
              </Link>
              <Link to="/unduh" className="rounded-full border border-dove bg-transparent px-6 py-3 text-[15px] font-medium text-jet transition hover:border-jet hover:bg-fg/6 active:translate-y-px sm:px-7.5 sm:py-3.5 sm:text-base">
                Unduh Offline
              </Link>
            </div>
            <div className="hero-reveal relative z-10 mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-xs tracking-wide text-jet sm:mt-9">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Gratis tanpa kartu kredit
              </span>
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Cocok untuk toko retail kecil dan menengah
              </span>
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Desktop · tablet · mobile
              </span>
            </div>
          </div>

          <div className="hero-visual container relative mx-auto mt-10 max-w-6xl px-5 md:mt-18 md:px-8">
            <div
              className="pointer-events-none absolute -top-24 -right-16 z-0 h-90 w-90 rounded-full blur-6xl sm:-top-28 sm:-right-18 sm:h-130 sm:w-130"
              style={{ background: 'radial-gradient(circle at 32% 32%, #ffa888 0%, color-mix(in oklch, #ff8868 55%, transparent) 42%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative z-1 overflow-hidden rounded-xl border border-dove bg-paper shadow-[rgba(0,0,0,0.06)_0_0_0_1px,rgba(15,23,42,0.18)_0_18px_40px_-24px]">
              <div className="flex items-center gap-3 border-b border-dove bg-cream px-4 py-3">
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#ffbd2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                </span>
                <span className="font-mono text-xs tracking-wide text-steel">openpos · kasir</span>
                <Link to="/demo" className="ml-auto rounded-full bg-jet px-4 py-1.5 text-xs font-medium text-paper transition hover:opacity-85">
                  Coba full demo →
                </Link>
              </div>
              <iframe
                src="/demo?embed=1"
                title="Demo interaktif OpenPOS"
                loading="lazy"
                className="block h-[560px] w-full border-0 bg-white md:h-[620px]"
              />
            </div>
            <p className="mt-4.5 text-center font-mono text-xs text-steel">
              coba interaktif · semua menu bisa diklik ·{' '}
              <Link to="/demo" className="underline underline-offset-2 hover:text-jet">
                buka demo penuh
              </Link>
            </p>
          </div>
        </section>

        <section id="fitur" className="section border-t border-border">
          <div className="container mx-auto max-w-6xl px-5 md:px-8">
            <div className="reveal max-w-[680px]">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-steel">Fitur</p>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em]">
                Fitur yang dibutuhkan toko kecil, tanpa yang berlebihan.
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                { mark: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />, t: 'Kasir yang cepat', d: 'Cari produk lewat nama, SKU, atau barcode, lalu tambahkan ke keranjang, terima pembayaran, dan cetak struk. Satu transaksi selesai dalam hitungan detik.' },
                { mark: <path d="M12 2 4 6v12l8 4 8-4V6l-8-4zM4 6l8 4 8-4M12 10v10" />, t: 'Produk dan stok real-time', d: 'Stok berkurang otomatis setiap transaksi dan kembali saat refund. Anda tidak akan kehabisan stok tanpa sadar atau menumpuk barang yang tidak terjual.' },
                { mark: <path d="M3 21h18M6 17v-6M11.5 17V8M17 17v-9" />, t: 'Laporan yang rapi', d: 'Omzet harian, produk terlaris, dan profit terlihat langsung dari dashboard. Tidak perlu menghitung manual di buku kas.' },
              ].map((f, i) => (
                <div key={f.t} className="feature reveal group" data-delay={i}>
                  <span className="mb-5 grid h-9 w-9 place-items-center text-fog transition-colors duration-150 group-hover:text-jet">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">{f.mark}</svg>
                  </span>
                  <h3 className="mb-1.5 text-2xl font-medium leading-[1.3] tracking-[-0.01em]">{f.t}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="section border-t border-border bg-sand">
          <div className="container mx-auto max-w-6xl px-5 md:px-8">
            <div className="reveal max-w-[680px]">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-steel">Cara Kerja</p>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em]">
                Dari mendaftar sampai transaksi pertama, hanya tiga langkah.
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                { n: '01', t: 'Buat akun dan toko', d: 'Daftar sekali. Akun admin dan data toko langsung dibuat bersamaan. Tanpa kartu kredit, tanpa biaya, dan tanpa masa percobaan.' },
                { n: '02', t: 'Tambah produk dan stok', d: 'Masukkan produk beserta harga dan stok awal, atau impor ratusan baris sekaligus lewat file CSV.' },
                { n: '03', t: 'Mulai berjualan', d: 'Buka menu kasir, cari produk, selesaikan pembayaran, lalu cetak struk. Stok otomatis terbarui di dashboard.' },
              ].map((s, i) => (
                <div key={s.n} className="step reveal" data-delay={i}>
                  <span className="mb-5 block font-mono text-[26px] text-fog">{s.n}</span>
                  <h3 className="mb-1.5 text-2xl font-medium leading-[1.3] tracking-[-0.01em]">{s.t}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cerita" className="section border-t border-border">
          <div className="container mx-auto max-w-6xl px-5 md:px-8">
            <div className="reveal mb-8 max-w-[680px]">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-steel">Kata mereka</p>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em]">
                Dipakai toko-toko kecil di seluruh Indonesia.
              </h2>
            </div>
            <div className="marquee-wrap reveal" data-delay="1">
              <div className="marquee-track">
                {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                  <figure key={i} className="marquee-card w-80 flex-none rounded-2xl bg-cream p-5">
                    <div className="mb-2 text-[40px] leading-none text-fog" aria-hidden="true">&ldquo;</div>
                    <blockquote className="text-sm leading-relaxed">{t.quote}</blockquote>
                    <figcaption className="mt-4 flex items-center gap-2.5 text-sm text-steel">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-jet font-mono text-xs font-medium text-paper" aria-hidden="true">{t.initial}</span>
                      <span>
                        <span className="font-medium text-jet">{t.name}</span>
                        <span className="mt-0.5 block font-mono text-[11px] text-steel">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="tentang" className="section border-t border-border">
          <div className="container mx-auto grid max-w-6xl items-start gap-14 px-5 md:px-8 md:grid-cols-2">
            <div className="reveal">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-steel">Tentang</p>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em]">
                Sederhana untuk siapa pun, andal untuk bisnis yang bertumbuh.
              </h2>
              <p className="mt-10 text-lg leading-relaxed text-muted">
                OpenPOS lahir dari masalah yang sering terjadi. Mayoritas UMKM di Indonesia masih mencatat penjualan di buku kas atau Excel, sementara aplikasi kasir yang ada umumnya berbayar per bulan dan terlalu rumit untuk dipelajari.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Kami membuatnya berbeda. Antarmuka kasir yang sederhana, cukup untuk operasional harian toko kecil, dan gratis selamanya. Tanpa langganan dan tanpa masa percobaan yang berubah menjadi tagihan.
              </p>
            </div>
            <div className="reveal rounded-2xl bg-cream p-8" data-delay="1">
              <div className="mb-5 flex items-center gap-2">
                <span className="font-mono text-xs tracking-wide text-steel">openpos · penjualan 7 hari terakhir</span>
              </div>
<div className="landing-chart h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sales7} margin={{ top: 4, right: 14, bottom: 4, left: 14 }}>
                    <defs>
                      <linearGradient id="landingSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--t-jet)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--t-jet)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="landingSalesHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.5 0.1 160)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="oklch(0.5 0.1 160)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--t-dove)" />
                    <XAxis dataKey="day" interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Geist Mono', fill: 'var(--t-fog)' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ stroke: 'var(--t-fog)', strokeDasharray: '4 4' }} content={<SalesTooltip />} />
                    <Area type="monotone" dataKey="omzet" stroke="var(--t-jet)" strokeWidth={2} fill="url(#landingSales)" />
                    <Area className="landing-chart-hover" type="monotone" dataKey="omzet" stroke="oklch(0.5 0.1 160)" strokeWidth={2} fill="url(#landingSalesHover)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-center font-mono text-[11px] text-steel">omzet per hari · data demo</p>
            </div>
          </div>
        </section>

        <section id="daftar" className="section border-t border-border py-16 text-center">
          <div className="container mx-auto max-w-[640px] px-5 md:px-8">
            <h2 className="reveal text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em]">Mulai berjualan hari ini tanpa biaya langganan.</h2>
            <p className="reveal mx-auto mt-4 mb-8 max-w-[520px] text-lg leading-relaxed text-muted" data-delay="1">
              Daftar dalam satu menit. Buat toko, tambah produk, lalu terima pembayaran pertama Anda. Gratis selamanya.
            </p>
            <Link
              to="/daftar"
              className="reveal inline-block rounded-full bg-jet px-7.5 py-3.5 text-base font-medium text-paper transition hover:bg-[color-mix(in_oklch,var(--t-jet)_82%,white)] active:translate-y-px"
              data-delay="2"
            >
              Buat toko Anda sekarang
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

