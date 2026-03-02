import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import CalendarPicker from '../../components/ui/CalendarPicker'
import Spinner from '../../components/ui/Spinner'
import './DashboardPage.css'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatTime(dt: string): string {
  return dt.substring(11, 16)
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const [date, setDate] = useState(formatDate(new Date()))
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getAppointments(date).then(setAppointments).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [date])

  const handleCancel = async (id: number) => {
    await api.cancelAppointment(id)
    load()
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
        </div>

        {/* Right: Appointments */}
        <div className="dash__content">
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
                      {a.clientName} &middot; {a.clientPhone}
                    </div>
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
    </OwnerLayout>
  )
}
