import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import Button from './ui/Button'
import { useToast } from './ui/Toast'
import './ServiceTrimModal.css'

interface Service {
  id: number
  name: string
  durationMinutes: number
  price: number
  active: boolean
}

const FREE_TIER_LIMIT = 2

interface Props {
  effectiveTier?: string
  trigger: number
  onResolved: () => void
}

export default function ServiceTrimModal({ effectiveTier, trigger, onResolved }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [keep, setKeep] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (effectiveTier !== 'FREE') {
      setOpen(false)
      return
    }
    api.getServices().then((all: Service[]) => {
      const active = all.filter(s => s.active)
      if (active.length <= FREE_TIER_LIMIT) {
        setOpen(false)
        return
      }
      setServices(all)
      setKeep(new Set(active.slice(0, FREE_TIER_LIMIT).map(s => s.id)))
      setOpen(true)
    }).catch(() => {})
  }, [effectiveTier, trigger])

  const toggle = (id: number) => {
    setKeep(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < FREE_TIER_LIMIT) {
        next.add(id)
      }
      return next
    })
  }

  const submit = async () => {
    if (keep.size !== FREE_TIER_LIMIT) return
    setSubmitting(true)
    try {
      await api.keepServices(Array.from(keep))
      setOpen(false)
      onResolved()
      toast(t('serviceTrim.saved'), 'success')
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const activeServices = services.filter(s => s.active)

  return (
    <div className="service-trim__overlay">
      <div className="service-trim__modal">
        <h3 className="service-trim__title">{t('serviceTrim.title')}</h3>
        <p className="service-trim__desc">
          {t('serviceTrim.desc', { count: activeServices.length })}
        </p>
        <p className="service-trim__hint">{t('serviceTrim.pickHint')}</p>

        <div className="service-trim__list">
          {activeServices.map(s => {
            const checked = keep.has(s.id)
            const disabled = !checked && keep.size >= FREE_TIER_LIMIT
            return (
              <label
                key={s.id}
                className={`service-trim__item ${checked ? 'service-trim__item--checked' : ''} ${disabled ? 'service-trim__item--disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(s.id)}
                />
                <div className="service-trim__item-text">
                  <div className="service-trim__item-name">{s.name}</div>
                  <div className="service-trim__item-meta">
                    {s.durationMinutes} min &middot; {s.price} {t('dashboard.den')}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <div className="service-trim__counter">
          {t('serviceTrim.selected', { picked: keep.size, max: FREE_TIER_LIMIT })}
        </div>

        <div className="service-trim__actions">
          <Button onClick={submit} disabled={submitting || keep.size !== FREE_TIER_LIMIT}>
            {t('serviceTrim.confirm')}
          </Button>
        </div>

        <p className="service-trim__upgrade-note">
          {t('serviceTrim.orUpgrade')}{' '}
          <a href="/dashboard/settings#plan">{t('trial.upgrade')}</a>
        </p>
      </div>
    </div>
  )
}
