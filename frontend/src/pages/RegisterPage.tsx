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
import './RegisterPage.css'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [salonName, setSalonName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await api.register({ email, password, phone: phone || undefined, salonName })
      setUser(user)
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
          <h1 className="register-page__brand">Appointiko</h1>
          <LanguageSwitcher />
        </div>
        <Card>
          <h2 className="register-page__title">{t('auth.register')}</h2>
          <form onSubmit={handleSubmit} className="register-page__form">
            <Input label={t('auth.salonName')} value={salonName} onChange={e => setSalonName(e.target.value)} required />
            <Input label={t('auth.email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label={t('auth.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <PhoneInput label={t('auth.phone')} value={phone} onChange={setPhone} />
            {error && <p className="register-page__error">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {t('auth.register')}
            </Button>
          </form>
          <p className="register-page__footer">
            {t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
