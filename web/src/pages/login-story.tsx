import { DMA, LoginIcon, PJS } from './login-icons'

// Panel kanan halaman auth (dipakai /masuk + /pilih-akun).
export function LoginStory() {
  const bars = [
    { d: 'Sen', h: 58, hot: false },
    { d: 'Sel', h: 84, hot: false },
    { d: 'Rab', h: 70, hot: false },
    { d: 'Kam', h: 108, hot: false },
    { d: 'Jum', h: 94, hot: false },
    { d: 'Sab', h: 116, hot: true },
    { d: 'Min', h: 102, hot: false },
  ]
  return (
    <div className="hidden lg:flex flex-col justify-center flex-1 bg-[#10243B] relative overflow-hidden order-2 px-[clamp(24px,5vw,72px)] py-12">
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
            {bars.map((b, i) => (
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
  )
}
