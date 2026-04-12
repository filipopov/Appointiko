import { useState, useEffect } from 'react'
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
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme)

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const toggleTheme = (t: 'light' | 'dark') => {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('theme', t)
  }

  return (
    <>
      <button
        className={`hamburger ${open ? 'hamburger--open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <span className="hamburger__line" />
        <span className="hamburger__line" />
        <span className="hamburger__line" />
      </button>

      {open && (
        <div className="mobile-menu__backdrop" onClick={() => setOpen(false)}>
          <div className="mobile-menu__sheet" onClick={e => e.stopPropagation()}>
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
                    onClick={() => { i18n.changeLanguage(l.code); setOpen(false) }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
