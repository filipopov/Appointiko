import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './MobileMenu.css'

const langs = [
  { code: 'mk', label: 'MK' },
  { code: 'en', label: 'EN' },
  { code: 'sq', label: 'SQ' },
]

function getTheme(): 'light' | 'dark' {
  return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light'
}

export default function MobileMenu() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startY: 0, dragDist: 0, dragging: false })

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 280)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current.startY = e.touches[0].clientY
    dragRef.current.dragging = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return
    const dy = e.touches[0].clientY - dragRef.current.startY
    dragRef.current.dragDist = dy
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.dragging || !sheetRef.current) return
    const dist = dragRef.current.dragDist
    dragRef.current.dragging = false
    dragRef.current.dragDist = 0
    if (dist > 60) {
      sheetRef.current.style.transition = ''
      sheetRef.current.style.transform = ''
      close()
    } else {
      sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
      sheetRef.current.style.transform = 'translateY(0)'
    }
  }, [close])

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    const root = document.documentElement
    root.classList.add('theme-transition')
    root.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    setTimeout(() => root.classList.remove('theme-transition'), 450)
  }

  return (
    <>
      <button
        className={`hamburger ${open ? 'hamburger--open' : ''}`}
        onClick={() => open ? close() : setOpen(true)}
        aria-label="Menu"
      >
        <span className="hamburger__line" />
        <span className="hamburger__line" />
        <span className="hamburger__line" />
      </button>

      {(open || closing) && createPortal(
        <div
          className={`mobile-menu__backdrop ${closing ? 'mobile-menu__backdrop--closing' : ''}`}
          onClick={close}
        >
          <div
            ref={sheetRef}
            className={`mobile-menu__sheet ${closing ? 'mobile-menu__sheet--closing' : ''}`}
            onClick={e => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mobile-menu__handle" />

            <div className="mobile-menu__section">
              <div className="mobile-menu__section-label">{t('menu.appearance')}</div>
              <div className="mobile-menu__theme-toggle">
                <button
                  className={`mobile-menu__theme-btn ${theme === 'light' ? 'mobile-menu__theme-btn--active' : ''}`}
                  onClick={() => toggleTheme('light')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  {t('menu.light')}
                </button>
                <button
                  className={`mobile-menu__theme-btn ${theme === 'dark' ? 'mobile-menu__theme-btn--active' : ''}`}
                  onClick={() => toggleTheme('dark')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                  {t('menu.dark')}
                </button>
              </div>
            </div>

            <div className="mobile-menu__section">
              <div className="mobile-menu__section-label">{t('menu.language')}</div>
              <div className="mobile-menu__langs">
                {langs.map(l => (
                  <button
                    key={l.code}
                    className={`mobile-menu__lang-btn ${i18n.language === l.code ? 'mobile-menu__lang-btn--active' : ''}`}
                    onClick={() => { i18n.changeLanguage(l.code); close() }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
