import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import MobileMenu from '../components/MobileMenu'
import './LoginPage.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const failed = params.has('error')

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <Link to="/" className="login-page__brand"><Logo size={30} /> Appointiko</Link>
          <div className="login-page__header-right">
            <div className="desktop-only">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <MobileMenu />
          </div>
        </div>
        <Card>
          <h2 className="login-page__title">{t('auth.login')}</h2>
          <div className="login-page__form">
            <p>{t('auth.secureSignIn')}</p>
            {failed && <p className="login-page__error">{t('auth.signInFailed')}</p>}
            <Button fullWidth onClick={() => { window.location.href = api.loginUrl }}>
              {t('auth.login')}
            </Button>
          </div>
          <p className="login-page__footer">
            {t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
