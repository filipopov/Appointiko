import { useState, useEffect, useMemo, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AuthContext } from '../../App'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import CalendarPicker from '../../components/ui/CalendarPicker'
import Spinner from '../../components/ui/Spinner'
import OnboardingChecklist from '../../components/OnboardingChecklist'
import ShareLinkCard from '../../components/ShareLinkCard'
import './DashboardPage.css'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatTime(dt: string): string {
  return dt.substring(11, 16)
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useContext(AuthContext)
  const [date, setDate] = useState(formatDate(new Date()))
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const load = () => {
    setLoading(true)
    api.getAppointments(date).then(setAppointments).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [date])

  const handleCancel = async (id: number) => {
    await api.cancelAppointment(id)
    load()
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
    } catch (err: any) {
      setMaError(t(`errors.${err.code || 'UNKNOWN'}`))
    } finally {
      setMaSaving(false)
    }
  }

  const confirmed = appointments.filter(a => a.status === 'CONFIRMED')

  const dateLabel = useMemo(() => {
    const d = new Date(date + 'T00:00:00')
    return new Intl.DateTimeFormat(i18n.language || 'mk', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d)
  }, [date, i18n.language])

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
            <div className="dash__count">
              <span className="dash__count-num">{confirmed.length}</span>
              {t('dashboard.bookingsToday')}
            </div>
          )}

          {loading ? <Spinner /> : appointments.length === 0 ? (
            <Card>
              <div className="dash__empty">
                <div className="dash__empty-icon">&#128197;</div>
                <p className="dash__empty-text">{t('dashboard.noAppointments')}</p>
              </div>
            </Card>
          ) : (
            <div className="dash__list stagger">
              {appointments.map(a => (
                <Card key={a.id} className={`dash__appt ${a.status === 'CANCELLED' ? 'dash__appt--cancelled' : ''}`}>
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
                    {a.status === 'CANCELLED' ? (
                      <span className="dash__status-badge dash__status-badge--cancelled">{t('dashboard.cancelled')}</span>
                    ) : (
                      <>
                        <span className="dash__status-badge dash__status-badge--confirmed">{t('dashboard.confirmed')}</span>
                        <Button variant="danger" size="sm" onClick={() => handleCancel(a.id)}>
                          {t('dashboard.cancel')}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB: Add appointment */}
      <button className="dash__fab" onClick={openModal} title={t('dashboard.addAppointment')}>
        +
      </button>

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
                      {s.name} ({s.durationMinutes} min - {s.price} ден)
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
