import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { google?: any }
}

export function getGoogleClientId(): string | undefined {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
}

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-gsi]')) {
      const iv = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(iv); resolve() }
      }, 100)
      setTimeout(() => { clearInterval(iv); reject(new Error('Gagal memuat login Google.')) }, 10000)
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.gsi = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Gagal memuat login Google.'))
    document.head.appendChild(s)
  })
}

export function GoogleButton({ onToken, busy, text, fill, onError }: { onToken: (credential: string) => void; busy: boolean; text: 'signin_with' | 'signup_with'; fill?: boolean; onError?: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [loadErr, setLoadErr] = useState('')
  const [ready, setReady] = useState(false)
  const cbRef = useRef(onToken)
  cbRef.current = onToken
  const clientId = getGoogleClientId()

  useEffect(() => {
    if (!clientId) return
    let dead = false
    let timer: ReturnType<typeof setTimeout> | undefined
    loadGsi()
      .then(() => {
        if (dead || !ref.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp: { credential?: string }) => { if (resp?.credential) cbRef.current(resp.credential) },
        })
        // width = LEBAR MINIMUM (dok GIS: maks 400) — clamp agar tombol pasti render.
        const w = Math.min(Math.max(Math.round(ref.current.clientWidth) || 320, 200), 400)
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
          width: w, text, locale: 'id',
        })
        if (!dead) setReady(true)
        // Self-check: iframe 0x0 = render gagal (pemblokir/cookies) → tampilkan pesan.
        timer = setTimeout(() => {
          if (dead || !ref.current) return
          const f = ref.current.querySelector('iframe')
          const r = f?.getBoundingClientRect()
          if (!f || !r || r.width < 10 || r.height < 10) {
            const msg = 'Tombol Google gagal tampil (kemungkinan pemblokir iklan atau cookies pihak ketiga).'
            if (!dead) setLoadErr(msg)
            onError?.(msg)
          }
        }, 6000)
      })
      .catch(() => {
        if (!dead) {
          const msg = 'Gagal memuat login Google. Periksa koneksi lalu muat ulang.'
          setLoadErr(msg)
          // Di mode overlay (fill) pesan di dalam tak terlihat → angkat ke pemanggil.
          onError?.(msg)
        }
      })
    return () => { dead = true; if (timer) clearTimeout(timer) }
  }, [clientId, text, onError])

  if (!clientId) {
    return (
      <p className="rounded-lg bg-sand px-3.5 py-2.5 text-[13px] text-ember">
        Login Google belum dikonfigurasi (VITE_GOOGLE_CLIENT_ID kosong).
      </p>
    )
  }
  return (
    <div className={fill ? 'h-full w-full' : 'w-full'}>
      {busy && !fill && <p className="mb-2 text-center text-[13px] text-muted">Memproses login Google…</p>}
      <div className={fill ? 'relative h-full w-full' : 'relative w-full'} aria-busy={!ready} aria-label="Login dengan Google">
        {!ready && <div className="absolute inset-0 animate-pulse rounded-full border border-dove bg-surface" aria-hidden="true" />}
        <div ref={ref} className={`flex items-center justify-center ${fill ? 'h-full min-h-[52px] w-full' : 'h-12'}`} />
      </div>
      {loadErr && <p className="mt-2 text-center text-[13px] text-ember">{loadErr}</p>}
    </div>
  )
}
