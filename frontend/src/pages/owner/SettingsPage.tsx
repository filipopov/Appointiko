import { useState, useEffect, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AuthContext } from '../../App'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ShareLinkCard from '../../components/ShareLinkCard'
import { useToast } from '../../components/ui/Toast'
import { NORTH_MACEDONIA_CITIES } from '../../constants/cities'
import './SettingsPage.css'

export default function SettingsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { user } = useContext(AuthContext)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    api.getSalon().then((s: any) => {
      setName(s.name || '')
      setCity(s.city || '')
      setAddress(s.address || '')
      setPhone(s.phone || '')
      setInstagram(s.instagram || '')
      setDescription(s.description || '')
      setLatitude(s.latitude != null ? String(s.latitude) : '')
      setLongitude(s.longitude != null ? String(s.longitude) : '')
      setSlug(s.slug || '')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    await api.updateSalon({
      name, city, address, phone, instagram, description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    })
    toast(t('settings.saved'))
  }

  return (
    <OwnerLayout>
      <h2 className="settings__title">{t('settings.title')}</h2>

      <Card className="settings__form">
        <div className="settings__fields">
          <Input label={t('settings.name')} value={name} onChange={e => setName(e.target.value)} />
          <div className="settings__select-group">
            <label className="settings__label">{t('settings.city')}</label>
            <select
              className="settings__select"
              value={city}
              onChange={e => setCity(e.target.value)}
            >
              <option value="">{t('auth.selectCity')}</option>
              {NORTH_MACEDONIA_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label={t('settings.address')} value={address} onChange={e => setAddress(e.target.value)} />
          <Input label={t('settings.phone')} value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label={t('settings.instagram')} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yoursalon" />
          <div className="settings__textarea-group">
            <label className="settings__label">{t('settings.description')}</label>
            <textarea
              className="settings__textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('settings.descriptionPlaceholder')}
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="settings__row">
            <Input label={t('settings.latitude')} value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="41.9981" />
            <Input label={t('settings.longitude')} value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="21.4254" />
          </div>
          <p className="settings__hint">{t('settings.locationHint')}</p>
          <Button onClick={handleSave}>{t('settings.save')}</Button>
        </div>
      </Card>

      {slug && <ShareLinkCard slug={slug} />}

      {/* Plan & Billing */}
      <div id="plan">
        <h3 className="settings__section-title">{t('plan.title')}</h3>
        <Card className="settings__plan">
          <div className="settings__plan-info">
            <div className="settings__plan-row">
              <span className="settings__plan-label">{t('plan.currentTier')}</span>
              <span className={`settings__plan-tier settings__plan-tier--${(user?.salon?.tier || 'FREE').toLowerCase()}`}>
                {user?.salon?.tier || 'FREE'}
              </span>
            </div>
            <div className="settings__plan-row">
              <span className="settings__plan-label">{t('plan.effectiveTier')}</span>
              <span className={`settings__plan-tier settings__plan-tier--${(user?.salon?.effectiveTier || 'FREE').toLowerCase()}`}>
                {user?.salon?.effectiveTier || 'FREE'}
                {user?.salon?.trialActive && <span className="settings__plan-trial"> ({t('trial.active')})</span>}
              </span>
            </div>
            {user?.salon?.paidUntil && (
              <div className="settings__plan-row">
                <span className="settings__plan-label">{t('plan.paidUntil')}</span>
                <span>{new Date(user.salon.paidUntil).toLocaleDateString()}</span>
              </div>
            )}
            {user?.salon?.trialActive && user?.salon?.trialEndsAt && (
              <div className="settings__plan-row">
                <span className="settings__plan-label">{t('trial.active')}</span>
                <span>
                  {t('trial.daysLeft', {
                    days: Math.max(0, Math.ceil((new Date(user.salon.trialEndsAt).getTime() - Date.now()) / 86400000))
                  })}
                </span>
              </div>
            )}
          </div>

          {(user?.salon?.effectiveTier === 'FREE' || user?.salon?.tier === 'FREE') && (
            <div className="settings__upgrade">
              <h4>{t('plan.upgradeTitle')}</h4>
              <p>{t('plan.upgradeMessage')}</p>
              <div className="settings__bank-details">
                <strong>{t('plan.bankDetails')}</strong>
                <p>{t('plan.bankName')}</p>
                <p>{t('plan.accountNumber')}</p>
                <p>{t('plan.reference', { id: user?.salon?.id })}</p>
              </div>
              <div className="settings__price-list">
                <p>{t('plan.standardPrice')}</p>
                <p>{t('plan.premiumPrice')}</p>
              </div>
            </div>
          )}

          {user?.salon?.effectiveTier && user.salon.effectiveTier !== 'FREE' && (
            <BoostRequest salonId={user.salon.id} />
          )}
        </Card>
      </div>
    </OwnerLayout>
  )
}

function BoostRequest({ salonId }: { salonId: number }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [days, setDays] = useState<7 | 30>(7)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await api.requestBoost(days)
      setDone(true)
      toast(t('boost.submitted'), 'success')
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="settings__boost">
      <h4>{t('boost.title')}</h4>
      <p>{t('boost.description')}</p>
      <div className="settings__bank-details">
        <strong>{t('plan.bankDetails')}</strong>
        <p>{t('plan.bankName')}</p>
        <p>{t('plan.accountNumber')}</p>
        <p>{t('boost.reference', { id: salonId })}</p>
        <p className="settings__boost-prices">
          {t('boost.priceWeek')} &middot; {t('boost.priceMonth')}
        </p>
      </div>
      <div className="settings__boost-controls">
        <label>
          <input type="radio" name="boost-days" checked={days === 7} onChange={() => setDays(7)} />
          {t('boost.duration7')}
        </label>
        <label>
          <input type="radio" name="boost-days" checked={days === 30} onChange={() => setDays(30)} />
          {t('boost.duration30')}
        </label>
      </div>
      <Button onClick={submit} disabled={submitting || done}>
        {done ? t('boost.requested') : t('boost.requestBtn')}
      </Button>
    </div>
  )
}
