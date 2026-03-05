import { useState, useEffect, useMemo, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AuthContext } from '../../App'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import CalendarPicker from '../../components/ui/CalendarPicker'
import Skeleton from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import OnboardingChecklist from '../../components/OnboardingChecklist'
import ShareLinkCard from '../../components/ShareLinkCard'
import { useToast } from '../../components/ui/Toast'
import './DashboardPage.css'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatTime(dt: string): string {
  return dt.substring(11, 16)
}

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDate(d)
}

const STATUS_CLASSES: Record<string, string> = {
  CONFIRMED: 'dash__appt--confirmed',
  COMPLETED: 'dash__appt--completed',
  CANCELLED: 'dash__appt--cancelled',
  NO_SHOW: 'dash__appt--noshow',
}

const BADGE_CLASSES: Record<string, string> = {
  CONFIRMED: 'dash__status-badge--confirmed',
  COMPLETED: 'dash__status-badge--completed',
  CANCELLED: 'dash__status-badge--cancelled',
  NO_SHOW: 'dash__status-badge--noshow',
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useContext(AuthContext)
  const toast = useToast()
  const [date, setDate] = useState(formatDate(new Date()))
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Tomorrow preview
  const [tomorrowAppts, setTomorrowAppts] = useState<any[]>([])
  const [tomorrowOpen, setTomorrowOpen] = useState(() => new Date().getHours() >= 18)
  const [tomorrowLoading, setTomorrowLoading] = useState(false)

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: string; message: string } | null>(null)

  // Manual appointment modal
  const [showModal, setShowModal] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [maServiceId, setMaServiceId] = useState<number | ''>('')
  const [maTime, setMaTime] = useState('10:00')
  const [maClientName, setMaClientName] = useState('')
  const [maClientPhone, setMaClientPhone] = useState('')
  const [maComment, setMaComment] = useState('')
  const [maError, setMaError] = useState('')
  const [maSaving, setMaSaving] = useState(false)

  const slug = user?.salon?.slug || ''
  const isToday = date === formatDate(new Date())

  const load = () => {
    setLoading(true)
    api.getAppointments(date).then(setAppointments).catch(() => {}).finally(() => setLoading(false))
  }

  const loadTomorrow = () => {
    const tom = getTomorrow()
    setTomorrowLoading(true)
    api.getAppointments(tom).then(setTomorrowAppts).catch(() => {}).finally(() => setTomorrowLoading(false))
  }

  useEffect(load, [date])
  useEffect(() => { if (isToday) loadTomorrow() }, [isToday])

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'cancel') await api.cancelAppointment(id)
      else if (action === 'complete') await api.completeAppointment(id)
      else if (action === 'noshow') await api.noShowAppointment(id)
      load()
      if (isToday) loadTomorrow()
      toast(t(`dashboard.${action}Success`), 'success')
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    }
    setConfirmAction(null)
  }

  const confirmAndDo = (id: number, action: string, message: string) => {
    setConfirmAction({ id, action, message })
  }

  const openModal = () => {
    setShowModal(true)
    setMaError('')
    if (services.length === 0) {
      api.getServices().then(setServices).catch(() => {})
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setMaServiceId('')
    setMaTime('10:00')
    setMaClientName('')
    setMaClientPhone('')
    setMaComment('')
    setMaError('')
  }

  const handleCreateAppointment = async () => {
    if (!maServiceId || !maClientName.trim()) return
    setMaError('')
    setMaSaving(true)
    try {
      const startTime = `${date}T${maTime}:00`
      await api.createAppointment({
        serviceId: maServiceId as number,
        startTime,
        clientName: maClientName.trim(),
        clientPhone: maClientPhone.trim() || undefined,
        comment: maComment.trim() || undefined,
      })
      closeModal()
      load()
      toast(t('dashboard.appointmentCreated'), 'success')
    } catch (err: any) {
      setMaError(t(`errors.${err.code || 'UNKNOWN'}`))
    } finally {
      setMaSaving(false)
    }
  }

  const confirmed = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED')

  const dayRevenue = useMemo(() => {
    return appointments
      .filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED')
      .reduce((sum: number, a: any) => sum + (a.servicePrice || 0), 0)
  }, [appointments])

  const dateLabel = useMemo(() => {
    const d = new Date(date + 'T00:00:00')
    return new Intl.DateTimeFormat(i18n.language || 'mk', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d)
  }, [date, i18n.language])

  const tomorrowLabel = useMemo(() => {
    const d = new Date(getTomorrow() + 'T00:00:00')
    return new Intl.DateTimeFormat(i18n.language || 'mk', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d)
  }, [i18n.language])

  const renderApptCard = (a: any) => (
    <Card key={a.id} className={`dash__appt ${STATUS_CLASSES[a.status] || ''}`}>
      <div>
        <div className="dash__appt-time">
          {formatTime(a.startTime)} - {formatTime(a.endTime)}
        </div>
        <div className="dash__appt-service">{a.serviceName}</div>
        <div className="dash__appt-client">
          {a.clientName}{a.clientPhone ? ` \u00B7 ${a.clientPhone}` : ''}
        </div>
        {a.comment && (
          <div className="dash__appt-comment">{a.comment}</div>
        )}
      </div>
      <div className="dash__appt-actions">
        <span className={`dash__status-badge ${BADGE_CLASSES[a.status] || ''}`}>
          {t(`dashboard.status_${a.status}`)}
        </span>
        {a.status === 'CONFIRMED' && (
          <div className="dash__action-btns">
            <button className="dash__action-btn dash__action-btn--complete" title={t('dashboard.markComplete')}
              onClick={() => handleAction(a.id, 'complete')}>
              &#10003;
            </button>
            <button className="dash__action-btn dash__action-btn--noshow" title={t('dashboard.markNoShow')}
              onClick={() => handleAction(a.id, 'noshow')}>
              ?
            </button>
            <button className="dash__action-btn dash__action-btn--cancel" title={t('dashboard.cancel')}
              onClick={() => confirmAndDo(a.id, 'cancel', t('dashboard.confirmCancel'))}>
              &#10005;
            </button>
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <OwnerLayout>
      <div className="dash">
        {/* Left: Calendar */}
        <div className="dash__sidebar">
          <Card className="dash__cal-card">
            <CalendarPicker value={date} onChange={setDate} />
            <Button variant="secondary" fullWidth size="sm" className="dash__today-btn" onClick={() => setDate(formatDate(new Date()))}>
              {t('dashboard.today')}
            </Button>
          </Card>

          {slug && <ShareLinkCard slug={slug} />}
        </div>

        {/* Right: Appointments */}
        <div className="dash__content">
          {slug && <OnboardingChecklist slug={slug} />}

          <div className="dash__content-header">
            <h2 className="dash__title">{t('nav.dashboard')}</h2>
            <span className="dash__date-label">{dateLabel}</span>
          </div>

          {confirmed.length > 0 && (
            <div className="dash__stats-row">
              <div className="dash__count">
                <span className="dash__count-num">{confirmed.length}</span>
                {t('dashboard.bookingsToday')}
              </div>
              {dayRevenue > 0 && (
                <div className="dash__revenue">
                  {dayRevenue} {t('dashboard.den')}
                </div>
              )}
            </div>
          )}

          {loading ? <Skeleton rows={4} height={80} /> : appointments.length === 0 ? (
            <Card className="dash__empty-card">
              <div className="dash__empty">
                <div className="dash__empty-icon">&#128197;</div>
                <p className="dash__empty-text">{t('dashboard.noAppointments')}</p>
                {slug && (
                  <p className="dash__empty-cta">
                    {t('dashboard.shareToGet')}{' '}
                    <button className="dash__empty-link" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/b/${slug}`)
                      toast(t('settings.copied'), 'info')
                    }}>
                      {t('dashboard.copyLink')}
                    </button>
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <div className="dash__list stagger">
              {appointments.map(renderApptCard)}
            </div>
          )}

          {/* Tomorrow preview */}
          {isToday && (
            <div className="dash__tomorrow">
              <button className="dash__tomorrow-toggle" onClick={() => setTomorrowOpen(!tomorrowOpen)}>
                <span className="dash__tomorrow-title">
                  {t('dashboard.tomorrow')} &middot; {tomorrowLabel}
                </span>
                <span className="dash__tomorrow-count">
                  {tomorrowAppts.filter(a => a.status === 'CONFIRMED').length}
                </span>
                <span className={`dash__tomorrow-arrow ${tomorrowOpen ? 'dash__tomorrow-arrow--open' : ''}`}>&#9660;</span>
              </button>
              {tomorrowOpen && (
                <div className="dash__tomorrow-content">
                  {tomorrowLoading ? <Skeleton rows={2} height={60} /> :
                    tomorrowAppts.length === 0 ? (
                      <p className="dash__tomorrow-empty">{t('dashboard.noAppointments')}</p>
                    ) : (
                      <div className="dash__list">
                        {tomorrowAppts.filter(a => a.status !== 'CANCELLED').map(a => (
                          <div key={a.id} className="dash__tomorrow-item">
                            <span className="dash__appt-time">{formatTime(a.startTime)}</span>
                            <span className="dash__tomorrow-detail">{a.serviceName} &middot; {a.clientName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB: Add appointment */}
      <button className="dash__fab" onClick={openModal} title={t('dashboard.addAppointment')}>
        +
      </button>

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          confirmLabel={t('dashboard.confirm')}
          cancelLabel={t('dashboard.goBack')}
          onConfirm={() => handleAction(confirmAction.id, confirmAction.action)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Manual appointment modal */}
      {showModal && (
        <div className="dash__modal-overlay" onClick={closeModal}>
          <div className="dash__modal" onClick={e => e.stopPropagation()}>
            <div className="dash__modal-header">
              <h3>{t('dashboard.addAppointment')}</h3>
              <button className="dash__modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="dash__modal-body">
              <div className="input-group">
                <label className="input-group__label">{t('dashboard.selectService')}</label>
                <select
                  className="input-group__field"
                  value={maServiceId}
                  onChange={e => setMaServiceId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">{t('dashboard.selectServicePlaceholder')}</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min - {s.price} {t('dashboard.den')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="dash__modal-row">
                <Input label={t('dashboard.date')} type="date" value={date} onChange={e => setDate(e.target.value)} />
                <Input label={t('dashboard.time')} type="time" value={maTime} onChange={e => setMaTime(e.target.value)} />
              </div>
              <Input label={t('booking.name')} value={maClientName} onChange={e => setMaClientName(e.target.value)} required />
              <Input label={t('booking.phone')} value={maClientPhone} onChange={e => setMaClientPhone(e.target.value)} />
              <div className="input-group">
                <label className="input-group__label">{t('booking.comment')}</label>
                <textarea
                  className="input-group__field"
                  value={maComment}
                  onChange={e => setMaComment(e.target.value)}
                  rows={2}
                />
              </div>
              {maError && <p className="dash__modal-error">{maError}</p>}
              <Button
                fullWidth
                onClick={handleCreateAppointment}
                disabled={maSaving || !maServiceId || !maClientName.trim()}
              >
                {t('dashboard.saveAppointment')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  )
}
