import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './TrialBanner.css'

interface Props {
  trialEndsAt: string | null
  trialActive: boolean
  effectiveTier: string
  tier: string
}

export default function TrialBanner({ trialEndsAt, trialActive, effectiveTier, tier }: Props) {
  const { t } = useTranslation()

  // Trial is active — show countdown
  if (trialActive && trialEndsAt) {
    const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    const urgent = days <= 1

    return (
      <div className={`trial-banner ${urgent ? 'trial-banner--urgent' : 'trial-banner--active'}`}>
        <div className="trial-banner__content">
          <div className="trial-banner__label">
            <span className="trial-banner__icon">&#9733;</span>
            {t('trial.active')}
          </div>
          <span className="trial-banner__countdown">
            {urgent ? t('trial.lastDay') : t('trial.daysLeft', { days })}
          </span>
        </div>
        <p className="trial-banner__message">{t('trial.message')}</p>
        <Link to="/dashboard/settings#plan" className="trial-banner__cta">{t('trial.upgrade')}</Link>
      </div>
    )
  }

  // Trial expired, now on FREE — show upgrade nudge
  if (effectiveTier === 'FREE' && tier === 'FREE' && trialEndsAt) {
    return (
      <div className="trial-banner trial-banner--expired">
        <div className="trial-banner__content">
          <div className="trial-banner__label">{t('trial.expired')}</div>
        </div>
        <p className="trial-banner__message">{t('trial.expiredMessage')}</p>
        <Link to="/dashboard/settings#plan" className="trial-banner__cta">{t('trial.upgrade')}</Link>
      </div>
    )
  }

  return null
}
