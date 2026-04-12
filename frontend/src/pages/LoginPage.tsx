import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { AuthContext } from '../App'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './LoginPage.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await api.login({ email, password })
      setUser(user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(t(`errors.${err.code || 'UNKNOWN'}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <h1 className="login-page__brand"><Logo size={30} /> Appointiko</h1>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <Card>
          <h2 className="login-page__title">{t('auth.login')}</h2>
          <form onSubmit={handleSubmit} className="login-page__form">
            <Input label={t('auth.email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label={t('auth.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="login-page__error">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {t('auth.login')}
            </Button>
          </form>
          <p className="login-page__footer">
            {t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
