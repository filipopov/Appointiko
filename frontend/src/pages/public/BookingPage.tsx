import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import CalendarPicker from '../../components/ui/CalendarPicker'
import PhoneInput from '../../components/ui/PhoneInput'
import Skeleton from '../../components/ui/Skeleton'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import ThemeToggle from '../../components/ThemeToggle'
import MobileMenu from '../../components/MobileMenu'
import { isValidMkPhone, cleanPhone } from '../../utils/phone'
import './BookingPage.css'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

type Step = 'service' | 'date' | 'time' | 'info' | 'done'

const stepOrder: Step[] = ['service', 'date', 'time', 'info']

function generateICS(salonName: string, serviceName: string, date: string, time: string, durationMin: number): string {
  const start = date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00'
  const endDate = new Date(`${date}T${time}:00`)
  endDate.setMinutes(endDate.getMinutes() + durationMin)
  const end = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${serviceName} - ${salonName}`,
    `DESCRIPTION:Appointment at ${salonName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()

  const [salon, setSalon] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [date, setDate] = useState(formatDate(new Date()))
  const [slots, setSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientComment, setClientComment] = useState('')
  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Working hours
  const [workingHours, setWorkingHours] = useState<any[]>([])

  // Social proof
  const [bookingsCount, setBookingsCount] = useState(0)

  // Phone lookup debounce
  const lookupTimeout = useRef<ReturnType<typeof setTimeout>>()

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scrollToSection = useCallback((sectionKey: string) => {
    setTimeout(() => {
      sectionRefs.current[sectionKey]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  useEffect(() => {
    if (!slug) return
    Promise.all([
      api.publicSalon(slug),
      api.publicServices(slug),
      api.publicWorkingHours(slug).catch(() => []),
      api.publicStats(slug).catch(() => ({ bookingsThisMonth: 0 })),
    ]).then(([s, svcs, wh, stats]) => {
      setSalon(s)
      setServices(svcs)
      setWorkingHours(wh)
      setBookingsCount(stats.bookingsThisMonth)
    }).catch(() => setNotFound(true))
  }, [slug])

  useEffect(() => {
    if (!slug || !selectedService || !date) return
    setLoading(true)
    api.publicSlots(slug, selectedService.id, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [slug, selectedService, date])

  // Phone auto-detect returning clients
  const handlePhoneChange = (phone: string) => {
    setClientPhone(phone)
    const cleaned = cleanPhone(phone)
    if (!slug || !cleaned || !isValidMkPhone(cleaned)) return
    clearTimeout(lookupTimeout.current)
    lookupTimeout.current = setTimeout(() => {
      api.publicClientLookup(slug, cleaned).then(result => {
        if (result.clientName && !clientName) {
          setClientName(result.clientName)
        }
      }).catch(() => {})
    }, 500)
  }

  const handleBook = async () => {
    if (!slug || !selectedService || !selectedSlot) return
    const cleaned = cleanPhone(clientPhone)
    if (cleaned && !isValidMkPhone(cleaned)) return
    setError('')
    setLoading(true)
    try {
      const startTime = `${date}T${selectedSlot}:00`
      await api.publicBook(slug, {
        serviceId: selectedService.id,
        startTime,
        clientName,
        clientPhone: cleaned,
        comment: clientComment.trim() || null,
      })
      setStep('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(t(`errors.${err.code || 'UNKNOWN'}`))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadICS = () => {
    if (!selectedService || !selectedSlot || !salon) return
    const ics = generateICS(salon.name, selectedService.name, date, selectedSlot, selectedService.durationMinutes)
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'appointment.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStepState = (s: Step): 'done' | 'active' | 'pending' => {
    if (step === 'done') return 'done'
    const current = stepOrder.indexOf(step)
    const target = stepOrder.indexOf(s)
    if (target < current) return 'done'
    if (target === current) return 'active'
    return 'pending'
  }

  // Today's working hours
  const todayHours = workingHours.length > 0 ? (() => {
    const dow = new Date().getDay() || 7 // 1=Mon..7=Sun
    return workingHours.find((wh: any) => wh.dayOfWeek === dow)
  })() : null

  if (notFound) {
    return (
      <div className="booking">
        <Card>
          <div className="booking__empty">
            <div className="booking__empty-icon">&#128566;</div>
            <p className="booking__empty-text">{t('errors.SALON_NOT_FOUND')}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!salon) return <div className="booking"><Skeleton rows={5} height={60} /></div>

  return (
    <div className="booking">
      {step !== 'done' && (
        <>
          <div className="booking__steps-wrapper">
            <div className="booking__steps">
              {stepOrder.map((s, i) => {
                const state = getStepState(s)
                return (
                  <div key={s} className={`booking__step booking__step--${state}`}>
                    {i > 0 && (
                      <div className={`booking__step-line ${
                        stepOrder.indexOf(step) > i ? 'booking__step-line--done' :
                        stepOrder.indexOf(step) === i ? 'booking__step-line--active' : ''
                      }`} />
                    )}
                    <span className="booking__step-num">{state === 'done' ? '\u2713' : i + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="booking__steps-spacer" />
        </>
      )}

      {selectedService && step !== 'done' && step !== 'service' && (
        <>
          <div className="booking__sticky-summary">
            <span className="booking__sticky-name">{selectedService.name}</span>
            <span className="booking__sticky-meta">
              {selectedService.durationMinutes} min &middot; {selectedService.price} {t('booking.den')}
            </span>
          </div>
          <div className="booking__summary-spacer" />
        </>
      )}

      <div className="booking__header">
        <div className="booking__header-left">
          {salon.imageUpdatedAt && (
            <img
              className="booking__salon-image"
              src={`/api/public/salons/${salon.slug}/image?v=${encodeURIComponent(salon.imageUpdatedAt)}`}
              alt=""
              loading="lazy"
            />
          )}
          <div>
            <h1 className="booking__salon-name">{salon.name}</h1>
            {salon.address && (
              <p className="booking__salon-address">
                {salon.address}{salon.city ? `, ${salon.city}` : ''}
              </p>
            )}
            {todayHours && (
              <p className="booking__salon-hours">
                {todayHours.isWorkingDay
                  ? todayHours.blocks.map((b: any, i: number) => (
                      <span key={i}>
                        {i > 0 ? ', ' : ''}
                        {(b.startTime || '').substring(0, 5)} - {(b.endTime || '').substring(0, 5)}
                      </span>
                    ))
                  : t('booking.closed')}
              </p>
            )}
          </div>
        </div>
        <div className="booking__header-right">
          <div className="desktop-only">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <MobileMenu />
        </div>
      </div>

      {bookingsCount >= 5 && (
        <div className="booking__social-proof">
          {t('booking.socialProof', { count: bookingsCount, salon: salon.name })}
        </div>
      )}

      {step === 'done' ? (
        <Card className="animate-in">
          <div className="booking__success">
            <div className="booking__success-icon">&#10003;</div>
            <h2 className="booking__success-title">{t('booking.success')}</h2>
            <p className="booking__success-detail">
              {selectedService.name} &middot; {date} &middot; {selectedSlot}
            </p>
            <div className="booking__success-actions">
              <Button onClick={handleDownloadICS} variant="secondary">
                {t('booking.addToCalendar')}
              </Button>
              <Button onClick={() => {
                setStep('service')
                setSelectedService(null)
                setSelectedSlot(null)
                setClientName('')
                setClientPhone('')
                setClientComment('')
              }}>
                {t('booking.bookAnother')}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="stagger">
          {/* Step 1: Select Service */}
          <div ref={el => { sectionRefs.current['service'] = el }}>
            <Card className="booking__section">
              <h3 className="booking__section-title">1. {t('booking.selectService')}</h3>
              <div className="booking__services">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep('date'); setSelectedSlot(null); scrollToSection('date') }}
                    className={`booking__svc-btn ${selectedService?.id === s.id ? 'booking__svc-btn--selected' : ''}`}
                  >
                    <div>
                      <div className="booking__svc-name">{s.name}</div>
                      <div className="booking__svc-duration">{t('booking.duration', { min: s.durationMinutes })}</div>
                    </div>
                    <div className="booking__svc-price">{t('booking.price', { price: s.price })}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Step 2: Select Date */}
          {selectedService && (
            <div ref={el => { sectionRefs.current['date'] = el }}>
              <Card className="booking__section animate-in">
                <h3 className="booking__section-title">2. {t('booking.selectDate')}</h3>
                <CalendarPicker
                  value={date}
                  onChange={d => { setDate(d); setSelectedSlot(null); setStep('date'); scrollToSection('time') }}
                  minDate={formatDate(new Date())}
                />
              </Card>
            </div>
          )}

          {/* Step 3: Select Time */}
          {selectedService && date && (step === 'date' || step === 'time' || step === 'info') && (
            <div ref={el => { sectionRefs.current['time'] = el }}>
              <Card className="booking__section animate-in">
                <h3 className="booking__section-title">3. {t('booking.selectTime')}</h3>
                {loading ? (
                  <Skeleton rows={2} height={44} />
                ) : slots.length === 0 ? (
                  <div className="booking__no-slots-box">
                    <p className="booking__no-slots">{t('booking.noSlots')}</p>
                    <p className="booking__no-slots-hint">{t('booking.tryNextWeek')}</p>
                  </div>
                ) : (
                  <div className="booking__slots">
                    {slots.map(s => {
                      const time = typeof s === 'string' ? s : s.startTime
                      const display = time.substring(0, 5)
                      return (
                        <button
                          key={time}
                          onClick={() => { setSelectedSlot(display); setStep('info'); scrollToSection('info') }}
                          className={`booking__slot-btn ${selectedSlot === display ? 'booking__slot-btn--selected' : ''}`}
                        >
                          {display}
                        </button>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Step 4: Client Info + Book */}
          {step === 'info' && selectedSlot && (
            <div ref={el => { sectionRefs.current['info'] = el }}>
              <Card className="animate-in">
                <h3 className="booking__section-title">4. {t('booking.yourInfo')}</h3>
                <div className="booking__info-form">
                  <PhoneInput label={t('booking.phone')} value={clientPhone} onChange={handlePhoneChange} required />
                  <Input label={t('booking.name')} value={clientName} onChange={e => setClientName(e.target.value)} required />
                  <div className="input-group">
                    <label className="input-group__label">{t('booking.comment')}</label>
                    <textarea
                      className="input-group__field booking__comment"
                      value={clientComment}
                      onChange={e => setClientComment(e.target.value)}
                      placeholder={t('booking.commentPlaceholder')}
                      rows={3}
                    />
                  </div>
                  {error && <p className="booking__error">{error}</p>}
                  <Button
                    fullWidth
                    onClick={handleBook}
                    disabled={loading || !clientName.trim() || !clientPhone.trim()}
                  >
                    {t('booking.book')}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
