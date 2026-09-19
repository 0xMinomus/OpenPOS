import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BookMarked, Building2, Link2, MapPin, Users } from 'lucide-react'
import Footer from './Footer'
import Navbar from './Navbar'

function GhMark({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
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

interface GhProfile {
  login: string
  name: string
  bio: string
  company: string
  location: string
  blog: string
  public_repos: number
  followers: number
  following: number
  avatar_url: string
}

const GH_FALLBACK: GhProfile = {
  login: '0xMinomus',
  name: 'Andika Putra',
  bio: 'README isinya larping doang itu.',
  company: '0xTeam',
  location: 'Earth',
  blog: 'https://andika-portofolio-eta.vercel.app/',
  public_repos: 4,
  followers: 1,
  following: 2,
  avatar_url: 'https://avatars.githubusercontent.com/u/207334042?v=4',
}

const GH_ADRR_FALLBACK: GhProfile = {
  login: 'adrr-dev',
  name: 'adrr-dev',
  bio: '',
  company: '',
  location: '',
  blog: '',
  public_repos: 9,
  followers: 1,
  following: 1,
  avatar_url: 'https://avatars.githubusercontent.com/u/228172413?v=4',
}

function toGh(d: any, fb: GhProfile): GhProfile {
  return {
    login: d.login, name: d.name ?? d.login, bio: d.bio ?? '',
    company: d.company ?? '', location: d.location ?? '', blog: d.blog ?? '',
    public_repos: d.public_repos ?? 0, followers: d.followers ?? 0,
    following: d.following ?? 0, avatar_url: d.avatar_url ?? fb.avatar_url,
  }
}

// Kartu profil GitHub (light): hanya terangkat + glow biru saat hover.
// Tanpa animasi idle, tanpa sorotan kursor, tanpa tilt — diam total.
function GhCard({ user, role, cta }: { user: GhProfile; role: string; cta: { label: string; href: string } }) {
  return (
    <div className="h-full">
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-dove bg-paper text-fg shadow-[rgba(15,23,42,0.12)_0_18px_40px_-24px] transition duration-300 hover:-translate-y-1.5 hover:border-jet hover:shadow-[rgba(26,118,209,0.22)_0_18px_48px_-20px]"
      >
        <div className="flex items-center gap-2 border-b border-dove bg-cream px-4 py-2.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] text-steel">github.com/{user.login}</span>
          <span className="ml-auto rounded-full border border-dove bg-paper px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">{role}</span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar_url}
              alt={`Foto profil GitHub ${user.login}`}
              loading="lazy"
              className="size-16 rounded-full border border-dove"
            />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold leading-tight">{user.name}</p>
              <p className="truncate font-mono text-sm text-steel">{user.login}</p>
            </div>
            <a
              href={`https://github.com/${user.login}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-dove bg-paper px-3.5 py-1.5 text-[13px] font-medium transition hover:border-jet hover:text-jet"
            >
              <GhMark />
              Follow
            </a>
          </div>
          {user.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{user.bio}</p>}
          <div className="mt-3 space-y-1.5 text-[13px] text-steel">
            {user.company && (
              <p className="flex items-center gap-2">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{user.company}</span>
              </p>
            )}
            {user.location && (
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{user.location}</span>
              </p>
            )}
            {user.blog && (
              <a href={user.blog} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-jet">
                <Link2 className="size-3.5 shrink-0" />
                <span className="truncate">{user.blog.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
          <div className="mt-auto pt-4">
            <div className="grid grid-cols-3 divide-x divide-dove rounded-xl border border-dove bg-cream text-center">
              <div className="py-2.5">
                <p className="flex items-center justify-center gap-1.5 text-base font-semibold tabular-nums">
                  <BookMarked className="size-4 text-fog" />
                  {user.public_repos}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">repo</p>
              </div>
              <div className="py-2.5">
                <p className="flex items-center justify-center gap-1.5 text-base font-semibold tabular-nums">
                  <Users className="size-4 text-fog" />
                  {user.followers}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">followers</p>
              </div>
              <div className="py-2.5">
                <p className="text-base font-semibold tabular-nums">{user.following}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">following</p>
              </div>
            </div>
            <a
              href={cta.href}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-xl bg-jet py-2.5 text-center text-sm font-medium text-paper transition hover:opacity-85"
            >
              {cta.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutVisual() {
  // Profil live dari GitHub API; fallback statis bila offline/rate-limit.
  const [gh, setGh] = useState<GhProfile>(GH_FALLBACK)
  const [adrr, setAdrr] = useState<GhProfile>(GH_ADRR_FALLBACK)
  useEffect(() => {
    let dead = false
    const load = (login: string, fb: GhProfile, set: (p: GhProfile) => void) => {
      fetch(`https://api.github.com/users/${login}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!dead && d?.login) set(toGh(d, fb)) })
        .catch(() => {})
    }
    load('0xMinomus', GH_FALLBACK, setGh)
    load('adrr-dev', GH_ADRR_FALLBACK, setAdrr)
    return () => { dead = true }
  }, [])
  return (
    <div className="reveal mx-auto grid w-full max-w-4xl items-stretch gap-6 md:grid-cols-2" data-delay="1">
      <GhCard user={gh} role="Frontend" cta={{ label: 'Lihat repo OpenPOS →', href: 'https://github.com/0xMinomus/OpenPOS' }} />
      <GhCard user={adrr} role="Backend" cta={{ label: 'Lihat repo API →', href: 'https://github.com/adrr-dev/openPOS' }} />
    </div>
  )
}

export default function Landing() {
  // Iframe demo: render di lebar virtual desktop (layout 100% kayak buka
  // /demo) lalu scale-down visual agar muat di card semula. Di HP render
  // 1:1 (layout responsif /demo). Scroll tetap di dalam iframe.
  const demoWrapRef = useRef<HTMLDivElement>(null)
  const [demoW, setDemoW] = useState(1100)
  useEffect(() => {
    const el = demoWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setDemoW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const demoVirtual = demoW < 768 ? demoW : 1280
  const demoScale = demoW / demoVirtual
  const demoViewH = demoW < 768 ? 640 : 620

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
          </div>

          <div className="hero-visual container relative mx-auto mt-8 max-w-6xl px-5 md:mt-10 md:px-8">
            <div className="relative z-1 overflow-hidden rounded-xl border border-dove bg-paper shadow-[rgba(0,0,0,0.06)_0_0_0_1px,rgba(15,23,42,0.18)_0_18px_40px_-24px]">
              <div className="flex items-center gap-3 border-b border-dove bg-cream px-4 py-3">
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#ffbd2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                </span>
                <span className="font-mono text-xs tracking-wide text-steel">openpos · demo</span>
                <Link to="/demo" className="ml-auto font-mono text-xs text-steel underline underline-offset-2 transition hover:text-jet">
                  Coba demo penuh
                </Link>
              </div>
              <div ref={demoWrapRef} className="overflow-hidden bg-white" style={{ height: demoViewH * demoScale }}>
                <iframe
                  src="/demo?embed=1"
                  title="Demo interaktif OpenPOS"
                  loading="lazy"
                  style={{ width: demoVirtual, height: demoViewH, border: 0, transform: `scale(${demoScale})`, transformOrigin: 'top left' }}
                />
              </div>
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

        <section id="cara-kerja" className="section border-t border-transparent bg-[#1a76d1]">
          <div className="container mx-auto max-w-6xl px-5 md:px-8">
            <div className="reveal max-w-[680px]">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-white/70">Cara Kerja</p>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em] text-white">
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
                  <span className="mb-5 block font-mono text-[26px] text-white/60">{s.n}</span>
                  <h3 className="mb-1.5 text-2xl font-medium leading-[1.3] tracking-[-0.01em] text-white">{s.t}</h3>
                  <p className="text-[15px] leading-relaxed text-white/80">{s.d}</p>
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
          <div className="container mx-auto max-w-6xl px-5 md:px-8">
            <div className="reveal mx-auto max-w-[680px] text-center">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-steel">Tentang</p>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-normal leading-[1.14] tracking-[-0.025em]">
                Sederhana untuk siapa pun, andal untuk bisnis yang bertumbuh.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted">
                OpenPOS lahir dari masalah yang sering terjadi. Mayoritas UMKM di Indonesia masih mencatat penjualan di buku kas atau Excel, sementara aplikasi kasir yang ada umumnya berbayar per bulan dan terlalu rumit untuk dipelajari.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Kami membuatnya berbeda. Antarmuka kasir yang sederhana, cukup untuk operasional harian toko kecil, dan gratis selamanya. Dibangun terbuka oleh dua orang ini:
              </p>
            </div>
            <div className="mt-10">
              <AboutVisual />
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

