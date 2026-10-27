import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { AuthContext } from '../App'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import PhoneInput from '../components/ui/PhoneInput'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import MobileMenu from '../components/MobileMenu'
import { NORTH_MACEDONIA_CITIES } from '../constants/cities'
import './RegisterPage.css'

/**
 * Step 1 (signed out): create the account on Keycloak.
 * Step 2 (signed in, no salon yet): set up the salon.
 */
export default function RegisterPage() {
  const { t } = useTranslation()
  const { user, setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [salonName, setSalonName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.setupSalon({ phone: phone || undefined, salonName, city, address })
      setUser(await api.me())
      navigate('/dashboard')
    } catch (err: any) {
      setError(t(`errors.${err.code || 'UNKNOWN'}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-page__container">
        <div className="register-page__header">
          <Link to="/" className="register-page__brand"><Logo size={30} /> Appointiko</Link>
          <div className="register-page__header-right">
            <div className="desktop-only">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <MobileMenu />
          </div>
        </div>
        {user ? (
          <Card>
            <h2 className="register-page__title">{t('auth.setupTitle')}</h2>
            <form onSubmit={handleSubmit} className="register-page__form">
              <Input label={t('auth.salonName')} value={salonName} onChange={e => setSalonName(e.target.value)} required />
              <div className="register-page__select-group">
                <label className="register-page__label">{t('auth.city')}</label>
                <select
                  className="register-page__select"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                >
                  <option value="">{t('auth.selectCity')}</option>
                  {NORTH_MACEDONIA_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Input label={t('auth.address')} value={address} onChange={e => setAddress(e.target.value)} required placeholder={t('auth.addressPlaceholder')} />
              <PhoneInput label={t('auth.phone')} value={phone} onChange={setPhone} />
              {error && <p className="register-page__error">{error}</p>}
              <Button type="submit" fullWidth disabled={loading}>
                {t('auth.setupSubmit')}
              </Button>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="register-page__title">{t('auth.register')}</h2>
            <div className="register-page__form">
              <p>{t('auth.secureSignUp')}</p>
              <Button fullWidth onClick={() => { window.location.href = api.signupUrl }}>
                {t('auth.register')}
              </Button>
            </div>
            <p className="register-page__footer">
              {t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
