import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './UpgradePrompt.css'

interface Props {
  type: 'service-limit' | 'no-notifications' | 'not-in-explore'
  salonId?: number
}

export default function UpgradePrompt({ type, salonId }: Props) {
  const { t } = useTranslation()

  const config = {
    'service-limit': {
      title: t('plan.limitReached'),
      message: t('plan.limitMessage'),
      icon: '&#128274;',
    },
    'no-notifications': {
      title: t('plan.noNotifications'),
      message: t('plan.noNotificationsMessage'),
      icon: '&#128276;',
    },
    'not-in-explore': {
      title: t('plan.notInExplore'),
      message: t('plan.notInExploreMessage'),
      icon: '&#128270;',
    },
  }[type]

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-prompt__icon" dangerouslySetInnerHTML={{ __html: config.icon }} />
      <div className="upgrade-prompt__body">
        <h4 className="upgrade-prompt__title">{config.title}</h4>
        <p className="upgrade-prompt__message">{config.message}</p>
        <div className="upgrade-prompt__actions">
          <Link to="/dashboard/settings#plan" className="upgrade-prompt__btn">{t('trial.upgrade')}</Link>
          <span className="upgrade-prompt__price">{t('plan.standardPrice')}</span>
        </div>
      </div>
    </div>
  )
}
