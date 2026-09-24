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

// Panel kiri halaman /daftar: headline + ilustrasi terminal & struk (fluid, tanpa absolute).
export function SignupStory() {
  return (
    <div className="hidden lg:flex flex-col justify-center flex-1 bg-[#10243B] relative overflow-hidden order-1 px-[clamp(24px,5vw,72px)] py-12">
      <div className="w-full max-w-[560px] mx-auto flex flex-col gap-[32px]">
        <div className="login-rise flex flex-col gap-[18px]" style={{ animationDelay: '80ms' }}>
          <div className={`text-[clamp(34px,4vw,52px)]/[1.06] text-white ${DMA} font-semibold`}>
            Buka toko hari ini.
            <br />
            Tumbuh dengan tenang.
          </div>
          <div className={`text-[17px]/[26px] max-w-[560px] text-[#C9D4E1] ${PJS} font-normal`}>
            Mulai dari transaksi pertama sampai laporan harian — semua siap tanpa biaya bulanan.
          </div>
          <div className="w-fit flex flex-row gap-[24px] items-center">
            <span className="w-fit flex flex-row gap-[8px] items-center">
              <LoginIcon name="credit-card" size={17} className="shrink-0" />
              <span className={`text-[14px] text-[#E6EDF5] ${PJS} font-normal whitespace-nowrap`}>Tanpa langganan</span>
            </span>
            <span className="w-fit flex flex-row gap-[8px] items-center">
              <LoginIcon name="zap" size={17} className="shrink-0" />
              <span className={`text-[14px] text-[#E6EDF5] ${PJS} font-normal whitespace-nowrap`}>Siap dalam 2 menit</span>
            </span>
          </div>
        </div>

        <div className="login-pop relative hidden min-[1200px]:block w-full" style={{ animationDelay: '160ms' }} aria-hidden={false}>
          <div className="absolute right-[8%] top-[-32px] w-[144px] h-[144px] opacity-[0.16] bg-[#D9F28E] rounded-full" aria-hidden="true" />
          <div className="relative rounded-[28px] bg-[#2F6FEB] px-[28px] pt-[20px] pb-[24px]">
            <div className="mx-auto w-[248px] max-w-full h-[12px] bg-[#173F96] rounded-[6px]" />
            <div className="h-[20px]" aria-hidden="true" />
            <div className="relative z-[2] w-[88%] ml-[6%] rounded-[16px_16px_8px_8px] bg-[#FFFEFA] p-[22px] shadow-[0px_16px_34px_#0000002E] flex flex-col gap-[13px]">
              <div className="w-full flex flex-row justify-between items-center gap-2">
                <div className="w-fit flex flex-row gap-[9px] items-center">
                  <span className="w-[32px] h-[32px] shrink-0 grid place-items-center bg-[#E9F0FF] rounded-[10px]" aria-hidden="true">
                    <LoginIcon name="receipt-text" size={17} />
                  </span>
                  <span className="w-fit flex flex-col gap-[2px]">
                    <span className={`text-[13px] text-[#102033] ${PJS} font-extrabold whitespace-nowrap`}>Transaksi #0186</span>
                    <span className={`text-[11px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>Hari ini · 10.42</span>
                  </span>
                </div>
                <span className="w-fit shrink-0 flex flex-row gap-[5px] p-[7px_10px] items-center bg-[#EAF6DC] rounded-[14px]">
                  <LoginIcon name="check" size={14} />
                  <span className={`text-[11px] text-[#39731F] ${PJS} font-extrabold tracking-[0.5px] whitespace-nowrap`}>LUNAS</span>
                </span>
              </div>
              <div className="w-full flex flex-row justify-between items-end gap-2">
                <span className="w-fit flex flex-col gap-[2px]">
                  <span className={`text-[10px] text-[#667085] ${PJS} font-extrabold tracking-[0.8px] whitespace-nowrap`}>TOTAL PEMBAYARAN</span>
                  <span className={`text-[28px] text-[#102033] ${DMA} font-bold whitespace-nowrap`}>Rp 148.000</span>
                </span>
                <span className={`text-[12px] text-[#2F6FEB] ${PJS} font-extrabold whitespace-nowrap`}>QRIS</span>
              </div>
              <div className="w-full h-[1px] shrink-0 bg-[#DDD7CB]" aria-hidden="true" />
              <div className="w-full flex flex-col gap-[9px]">
                {[
                  { sw: '#F3CFAE', name: 'Kopi Susu', qty: '2 × 24.000', val: 'Rp 48.000' },
                  { sw: '#CFE0FF', name: 'Paket Sarapan', qty: '1 × 100.000', val: 'Rp 100.000' },
                ].map((it) => (
                  <div key={it.name} className="w-full flex flex-row justify-between items-center gap-2">
                    <span className="w-fit flex flex-row gap-[9px] items-center">
                      <span className="w-[9px] h-[9px] shrink-0 rounded-[3px]" style={{ background: it.sw }} aria-hidden="true" />
                      <span className={`text-[12px] text-[#102033] ${PJS} font-bold whitespace-nowrap`}>{it.name}</span>
                    </span>
                    <span className={`text-[11px] text-[#667085] ${PJS} font-medium whitespace-nowrap`}>{it.qty}</span>
                    <span className={`text-[12px] text-[#102033] ${PJS} font-extrabold whitespace-nowrap`}>{it.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[64px]" aria-hidden="true" />
            <div className="flex flex-row justify-between items-center">
              <span className={`text-[12px] text-[#DCE7FF] ${PJS} font-extrabold tracking-[1.4px] whitespace-nowrap`}>OPENPOS</span>
              <span className="flex flex-row gap-[9px] items-center" aria-hidden="true">
                <span className="w-[10px] h-[10px] bg-[#D9F28E] rounded-full" />
                <span className="w-[10px] h-[10px] bg-[#FFFFFF66] rounded-full" />
                <span className="w-[10px] h-[10px] bg-[#FFFFFF33] rounded-full" />
              </span>
            </div>
            <div className="absolute z-[3] right-[14px] top-[38px] w-fit flex flex-row gap-[7px] p-[10px_13px] items-center bg-[#FFFEFA] rounded-[18px] shadow-[0px_8px_20px_#00000022]">
              <LoginIcon name="package-check" size={16} className="shrink-0" />
              <span className={`text-[11px] text-[#274319] ${PJS} font-extrabold whitespace-nowrap`}>
                Stok otomatis berkurang
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
