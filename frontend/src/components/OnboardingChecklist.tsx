import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import Card from './ui/Card'
import './OnboardingChecklist.css'

interface Props {
  slug: string
  trialActive?: boolean
  trialEndsAt?: string | null
}

export default function OnboardingChecklist({ slug, trialActive, trialEndsAt }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<{ hasServices: boolean; hasCustomHours: boolean } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    api.getOnboardingStatus().then(setStatus).catch(() => {})
  }, [])

  if (!status || dismissed) return null

  const allDone = status.hasServices && status.hasCustomHours
  if (allDone) return null

  const trialDays = trialActive && trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0

  const steps = [
    { key: 'services', done: status.hasServices, label: t('onboarding.addServices'), link: '/dashboard/services' },
    { key: 'hours', done: status.hasCustomHours, label: t('onboarding.setHours'), link: '/dashboard/hours' },
    { key: 'share', done: false, label: t('onboarding.shareLink'), link: '#share' },
  ]

  return (
    <Card className="onboarding">
      <div className="onboarding__header">
        <div>
          <h3 className="onboarding__title">{t('onboarding.title')}</h3>
          <p className="onboarding__subtitle">
            {trialActive
              ? t('onboarding.subtitleTrial', { days: trialDays })
              : t('onboarding.subtitle')}
          </p>
        </div>
        <button className="onboarding__dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">&times;</button>
      </div>
      <div className="onboarding__steps">
        {steps.map(step => (
          <Link
            key={step.key}
            to={step.link}
            className={`onboarding__step ${step.done ? 'onboarding__step--done' : ''}`}
          >
            <span className="onboarding__step-check">
              {step.done ? '\u2713' : ''}
            </span>
            <span className="onboarding__step-label">{step.label}</span>
            {!step.done && <span className="onboarding__step-arrow">&rsaquo;</span>}
          </Link>
        ))}
      </div>
    </Card>
  )
}
