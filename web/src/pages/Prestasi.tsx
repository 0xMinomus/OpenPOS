import { Link } from 'react-router'
import { ArrowUpRight, Trophy } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { DMA, LoginIcon, PJS } from './login-icons'

const FACTS = [
  { label: 'Peringkat', value: 'Juara 1' },
  { label: 'Kompetisi', value: 'Lomba Nasional Web' },
  { label: 'Penyelenggara', value: 'Invention · Universitas Udayana' },
]

export default function Prestasi() {
  return (
    <div className="landing-light min-h-screen bg-[#FFFEFA] text-fg flex flex-col">
      <Navbar logoTone="light" mobileLandingMenu />
      <main className="w-full flex-1 flex flex-col">
        <div className="box-border w-full flex-1 bg-[#F3EFE6] relative flex flex-col justify-center px-[clamp(24px,4vw,56px)] py-12">
          <div className="w-full max-w-[680px] mx-auto flex flex-col gap-5">
            <div className="login-rise flex flex-col gap-[12px]">
              <div className="flex flex-row gap-[9px] items-center">
                <span className="w-[26px] h-[2px] bg-[#2F6FEB] rounded-[2px]" aria-hidden="true" />
                <span className={`text-[12px] text-[#2F6FEB] ${PJS} font-bold tracking-[1.4px] whitespace-nowrap`}>PRESTASI</span>
              </div>
              <h1 className={`text-[clamp(32px,4vw,42px)]/[1.08] text-[#102033] ${DMA} font-normal tracking-[-0.025em]`}>
                Juara 1 Lomba Nasional Web.
              </h1>
              <p className={`text-[15px]/[23px] max-w-[560px] text-[#667085] ${PJS} font-normal`}>
                OpenPOS meraih Juara 1 pada Lomba Nasional Web yang diselenggarakan oleh
                Invention, Universitas Udayana.
              </p>
            </div>

            <div
              className="login-rise w-full p-[22px] bg-[#FFFEFA] outline outline-1 outline-[#BBD0FF] outline-offset-[-0.5px] rounded-[18px] shadow-[0px_8px_24px_#1020330D]"
              style={{ animationDelay: '80ms' }}
            >
              <div className="flex items-start gap-4">
                <span className="grid w-[52px] h-[52px] shrink-0 place-items-center bg-[#E9F0FF] rounded-[15px] text-[#2964F2]" aria-hidden="true">
                  <Trophy className="size-[27px]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className={`text-[18px] text-[#102033] ${DMA} font-bold`}>Lomba Nasional Web</p>
                  <p className={`mt-[4px] text-[12px]/[18px] text-[#667085] ${PJS} font-normal`}>
                    Penghargaan tingkat nasional dari Invention, Universitas Udayana.
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-[#E7E1D5] pt-5 sm:grid-cols-3">
                {FACTS.map((fact) => (
                  <div key={fact.label} className="flex flex-col gap-[3px]">
                    <dt className={`text-[10px] text-[#667085] ${PJS} font-semibold tracking-[0.7px] uppercase`}>{fact.label}</dt>
                    <dd className={`text-[13px]/[19px] text-[#102033] ${PJS} font-bold`}>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="login-rise flex flex-col sm:flex-row gap-[10px]" style={{ animationDelay: '140ms' }}>
              <Link
                to="/demo"
                className={`flex-1 h-[46px] flex flex-row gap-[8px] justify-center items-center bg-[#2F6FEB] rounded-[12px] text-[13px] text-white ${PJS} font-bold transition-all duration-150 hover:brightness-110 active:scale-[0.98]`}
              >
                Coba demo
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/unduh"
                className={`flex-1 h-[46px] flex flex-row gap-[8px] justify-center items-center bg-[#FFFEFA] outline outline-1 outline-[#DDD7CB] outline-offset-[-0.5px] rounded-[12px] text-[13px] text-[#102033] ${PJS} font-bold transition-all duration-150 hover:outline-[#2F6FEB] active:scale-[0.98]`}
              >
                <LoginIcon name="download" size={16} className="shrink-0" />
                Unduh aplikasi
              </Link>
            </div>

            <p className={`login-rise text-[12px]/[18px] text-[#667085] ${PJS} font-normal`} style={{ animationDelay: '200ms' }}>
              Terima kasih kepada Invention dan Universitas Udayana atas penghargaan ini,
              serta kepada semua pengguna dan kontributor OpenPOS.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
