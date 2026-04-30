import { useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AuthContext } from '../../App'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import './SettingsPage.css'

export default function PlanPage() {
  const { t } = useTranslation()
  const { user } = useContext(AuthContext)

  const tier = user?.salon?.tier || 'FREE'
  const effectiveTier = user?.salon?.effectiveTier || 'FREE'
  const trialActive = !!user?.salon?.trialActive
  const trialEndsAt = user?.salon?.trialEndsAt
  const paidUntil = user?.salon?.paidUntil
  const salonId = user?.salon?.id

  return (
    <OwnerLayout>
      <h2 className="settings__title">{t('plan.title')}</h2>

      <Card className="settings__plan">
        <div className="settings__plan-info">
          <div className="settings__plan-row">
            <span className="settings__plan-label">{t('plan.currentTier')}</span>
            <span className={`settings__plan-tier settings__plan-tier--${tier.toLowerCase()}`}>{tier}</span>
          </div>
          <div className="settings__plan-row">
            <span className="settings__plan-label">{t('plan.effectiveTier')}</span>
            <span className={`settings__plan-tier settings__plan-tier--${effectiveTier.toLowerCase()}`}>
              {effectiveTier}
              {trialActive && <span className="settings__plan-trial"> ({t('trial.active')})</span>}
            </span>
          </div>
          {paidUntil && (
            <div className="settings__plan-row">
              <span className="settings__plan-label">{t('plan.paidUntil')}</span>
              <span>{new Date(paidUntil).toLocaleDateString()}</span>
            </div>
          )}
          {trialActive && trialEndsAt && (
            <div className="settings__plan-row">
              <span className="settings__plan-label">{t('trial.active')}</span>
              <span>
                {t('trial.daysLeft', {
                  days: Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
                })}
              </span>
            </div>
          )}
        </div>

        {(effectiveTier === 'FREE' || tier === 'FREE') && (
          <div className="settings__upgrade">
            <h4>{t('plan.upgradeTitle')}</h4>
            <p>{t('plan.upgradeMessage')}</p>
            <div className="settings__bank-details">
              <strong>{t('plan.bankDetails')}</strong>
              <p>{t('plan.bankName')}</p>
              <p>{t('plan.accountNumber')}</p>
              <p>{t('plan.reference', { id: salonId })}</p>
            </div>
            <div className="settings__price-list">
              <p>{t('plan.standardPrice')}</p>
              <p>{t('plan.premiumPrice')}</p>
            </div>
          </div>
        )}

        {effectiveTier !== 'FREE' && salonId && <BoostRequest salonId={salonId} />}
      </Card>
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
