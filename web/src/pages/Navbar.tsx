import { Link, useLocation, useNavigate } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import { Logo } from '../lib/ui'

const SECTIONS = [
  { id: 'fitur', label: 'Fitur' },
  { id: 'cara-kerja', label: 'Cara Kerja' },
  { id: 'tentang', label: 'Tentang' },
  { id: 'unduh', label: 'Unduh', to: '/unduh' },
]

function lockPageScroll(scrollX: number, scrollY: number) {
  const bodyStyle = document.body.style
  const rootStyle = document.documentElement.style
  const previousBodyStyle = {
    position: bodyStyle.position,
    top: bodyStyle.top,
    left: bodyStyle.left,
    width: bodyStyle.width,
    overflow: bodyStyle.overflow,
  }
  const previousRootOverflow = rootStyle.overflow
  const previousRootScrollBehavior = rootStyle.scrollBehavior

  bodyStyle.position = 'fixed'
  bodyStyle.top = `${-scrollY}px`
  bodyStyle.left = `${-scrollX}px`
  bodyStyle.width = '100%'
  bodyStyle.overflow = 'hidden'
  rootStyle.overflow = 'hidden'

  return (scrollPosition = { x: scrollX, y: scrollY }) => {
    bodyStyle.position = previousBodyStyle.position
    bodyStyle.top = previousBodyStyle.top
    bodyStyle.left = previousBodyStyle.left
    bodyStyle.width = previousBodyStyle.width
    bodyStyle.overflow = previousBodyStyle.overflow
    rootStyle.overflow = previousRootOverflow
    rootStyle.scrollBehavior = 'auto'
    window.scrollTo(scrollPosition.x, scrollPosition.y)
    rootStyle.scrollBehavior = previousRootScrollBehavior
  }
}

export default function Navbar({ dark, logoTone = 'auto', mobileLandingMenu = false }: { dark?: boolean; logoTone?: 'auto' | 'light' | 'dark'; mobileLandingMenu?: boolean }) {
  const nav = useNavigate()
  const loc = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuOpenRef = useRef(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const focusRestoreRef = useRef<HTMLElement | null>(null)
  const menuScrollPositionRef = useRef<{ x: number; y: number } | null>(null)
  const pendingSectionRef = useRef<string | null>(null)
  const menuRouteNavigationRef = useRef(false)

  function goHome(e: React.MouseEvent) {
    e.preventDefault()
    if (loc.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      nav('/')
    }
  }

  function goSection(id: string) {
    const reduceMotion = mobileLandingMenu && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = reduceMotion ? 'instant' : 'smooth'
    if (loc.pathname === '/') {
      if (mobileLandingMenu && mobileMenuOpenRef.current) {
        pendingSectionRef.current = id
        closeMobileMenu()
        return
      }
      document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
    } else {
      nav('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' }), 120)
    }
  }

  function openMobileMenu() {
    focusRestoreRef.current = menuTriggerRef.current
    menuScrollPositionRef.current = { x: window.scrollX, y: window.scrollY }
    menuRouteNavigationRef.current = false
    mobileMenuOpenRef.current = true
    setMobileMenuOpen(true)
  }

  function closeMobileMenu() {
    mobileMenuOpenRef.current = false
    setMobileMenuOpen(false)
  }

  function navigateFromMobileMenu(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      (event.currentTarget.target && event.currentTarget.target !== '_self')
    ) return

    pendingSectionRef.current = null
    menuRouteNavigationRef.current = true
    closeMobileMenu()
  }

  useEffect(() => {
    if (!mobileLandingMenu || !mobileMenuOpen) return

    const scrollPosition = menuScrollPositionRef.current ?? { x: window.scrollX, y: window.scrollY }
    const { x: scrollX, y: scrollY } = scrollPosition
    const restorePageScroll = lockPageScroll(scrollX, scrollY)

    closeButtonRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeMobileMenu()
        return
      }
      if (event.key !== 'Tab' || !menuRef.current) return

      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const focusIsOutside = !menuRef.current.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
        event.preventDefault()
        first.focus()
      }
    }

    function containFocus(event: FocusEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeButtonRef.current?.focus({ preventScroll: true })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', containFocus)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', containFocus)
      const routeNavigation = menuRouteNavigationRef.current
      menuRouteNavigationRef.current = false
      restorePageScroll(routeNavigation ? { x: 0, y: 0 } : scrollPosition)
      menuScrollPositionRef.current = null

      const restoreTarget = focusRestoreRef.current
      if (restoreTarget?.isConnected) restoreTarget.focus({ preventScroll: true })
    }
  }, [mobileLandingMenu, mobileMenuOpen])

  useEffect(() => {
    if (!mobileLandingMenu || mobileMenuOpen || !pendingSectionRef.current) return

    const id = pendingSectionRef.current
    pendingSectionRef.current = null
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [mobileLandingMenu, mobileMenuOpen])

  useEffect(() => {
    if (!mobileLandingMenu) return

    const desktopQuery = window.matchMedia('(min-width: 48rem)')
    function closeOnDesktop() {
      if (desktopQuery.matches && mobileMenuOpenRef.current) {
        focusRestoreRef.current = logoRef.current
        mobileMenuOpenRef.current = false
        setMobileMenuOpen(false)
      }
    }
    desktopQuery.addEventListener('change', closeOnDesktop)
    return () => desktopQuery.removeEventListener('change', closeOnDesktop)
  }, [mobileLandingMenu])

  return (
    <>
      <header className={`sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-xl${mobileLandingMenu ? ' landing-mobile-navbar' : ''}`}>
        <div className="mx-auto grid min-w-0 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-4 py-3 md:gap-5 md:px-8">
          <Link ref={logoRef} to="/" onClick={goHome} className="flex items-center justify-self-start">
            <Logo tone={logoTone} className="h-7 w-auto sm:h-8" />
          </Link>
          {!dark && (
            <nav className="hidden gap-8 text-sm text-muted md:flex" aria-label="Navigasi utama">
              {SECTIONS.map((s) => (
                s.to
                  ? <Link key={s.id} to={s.to} className="hover:text-jet">{s.label}</Link>
                  : <button key={s.id} onClick={() => goSection(s.id)} className="hover:text-jet">{s.label}</button>
              ))}
            </nav>
          )}
          <div className={mobileLandingMenu
            ? 'col-start-3 flex min-w-0 items-center justify-self-end gap-1.5 md:gap-2.5'
            : 'flex min-w-0 items-center justify-self-end gap-1.5 md:gap-2.5'}
          >
            {mobileLandingMenu && (
              <button
                ref={menuTriggerRef}
                type="button"
                aria-label="Buka navigasi utama"
                aria-expanded={mobileMenuOpen}
                aria-controls="landing-mobile-menu"
                onClick={openMobileMenu}
                className="inline-grid size-11 shrink-0 place-items-center rounded-lg border border-dove text-jet transition-colors hover:border-jet hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jet md:hidden"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            )}
            {mobileLandingMenu ? (
              <div className="hidden items-center gap-1.5 md:flex md:gap-2.5">
                <Link to="/masuk" className="rounded-full border border-dove px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap hover:border-jet sm:px-3 md:px-4 md:py-2 md:text-sm">Masuk</Link>
                <Link to="/daftar" className="rounded-full border border-jet px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap hover:bg-jet hover:text-paper sm:px-3 md:px-4 md:py-2 md:text-sm">Mulai Gratis</Link>
              </div>
            ) : (
              <>
                <Link to="/masuk" className="rounded-full border border-dove px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap hover:border-jet sm:px-3 md:px-4 md:py-2 md:text-sm">Masuk</Link>
                <Link to="/daftar" className="rounded-full border border-jet px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap hover:bg-jet hover:text-paper sm:px-3 md:px-4 md:py-2 md:text-sm">Mulai Gratis</Link>
              </>
            )}
          </div>
        </div>
      </header>
      {mobileLandingMenu && <div className="landing-mobile-navbar-spacer" aria-hidden="true" />}
      {mobileLandingMenu && (
        <div
          ref={menuRef}
          id="landing-mobile-menu"
          className="landing-mobile-menu"
          role="dialog"
          aria-label="Menu navigasi"
          aria-modal={mobileMenuOpen ? true : undefined}
          aria-hidden={!mobileMenuOpen}
          hidden={!mobileMenuOpen}
        >
          <div className="landing-mobile-menu__inner">
            <div className="landing-mobile-menu__top">
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Tutup navigasi utama"
                onClick={closeMobileMenu}
                className="landing-mobile-menu__close focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jet"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <nav className="landing-mobile-menu__nav" aria-label="Navigasi utama">
              {SECTIONS.map((section) => (
                section.to
                  ? <Link
                    key={section.id}
                    to={section.to}
                    state={{ focusDestinationHeading: true }}
                    onClick={navigateFromMobileMenu}
                    className="landing-mobile-menu__link"
                  >{section.label}</Link>
                  : <button key={section.id} type="button" onClick={() => goSection(section.id)} className="landing-mobile-menu__link">{section.label}</button>
              ))}
              <Link
                to="/masuk"
                state={{ focusDestinationHeading: true }}
                onClick={navigateFromMobileMenu}
                className="landing-mobile-menu__link"
              >Masuk</Link>
              <Link
                to="/daftar"
                state={{ focusDestinationHeading: true }}
                onClick={navigateFromMobileMenu}
                className="landing-mobile-menu__link landing-mobile-menu__cta"
              >Mulai Gratis</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
