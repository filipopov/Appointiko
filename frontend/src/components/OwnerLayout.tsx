import { ReactNode, useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../App'
import { api } from '../api'
import LanguageSwitcher from './LanguageSwitcher'
import './OwnerLayout.css'

const navItems = [
  {
    path: '/dashboard',
    key: 'nav.dashboard',
    icon: (
      <svg className="layout__nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    path: '/dashboard/services',
    key: 'nav.services',
    icon: (
      <svg className="layout__nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h12M2 8h12M2 12h8" />
      </svg>
    ),
  },
  {
    path: '/dashboard/hours',
    key: 'nav.hours',
    icon: (
      <svg className="layout__nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4.5v4l2.5 1.5" />
      </svg>
    ),
  },
  {
    path: '/dashboard/settings',
    key: 'nav.settings',
    icon: (
      <svg className="layout__nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="2" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
      </svg>
    ),
  },
]

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const salonName = user?.salon?.name

  const handleLogout = async () => {
    await api.logout().catch(() => {})
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__left">
          <div className="layout__brand-group">
            <span className="layout__brand">Appointiko</span>
            {salonName && <span className="layout__salon-name">{salonName}</span>}
          </div>
          <nav className="layout__nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`layout__nav-link ${location.pathname === item.path ? 'layout__nav-link--active' : ''}`}
              >
                {item.icon}
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="layout__right">
          <LanguageSwitcher />
          <button className="layout__logout" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </div>
        <button
          className="layout__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? '\u2715' : '\u2630'}
        </button>
      </header>

      <div className={`layout__mobile-menu ${menuOpen ? 'layout__mobile-menu--open' : ''}`}>
        {salonName && <div className="layout__mobile-salon">{salonName}</div>}
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`layout__nav-link ${location.pathname === item.path ? 'layout__nav-link--active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.icon}
            {t(item.key)}
          </Link>
        ))}
        <div className="layout__mobile-actions">
          <LanguageSwitcher />
          <button className="layout__logout" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </div>
      </div>

      <main className="layout__main">
        {children}
      </main>
    </div>
  )
}
