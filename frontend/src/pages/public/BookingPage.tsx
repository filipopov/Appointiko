import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import CalendarPicker from '../../components/ui/CalendarPicker'
import PhoneInput from '../../components/ui/PhoneInput'
import Spinner from '../../components/ui/Spinner'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { isValidMkPhone, cleanPhone } from '../../utils/phone'
import './BookingPage.css'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

type Step = 'service' | 'date' | 'time' | 'info' | 'done'

const stepOrder: Step[] = ['service', 'date', 'time', 'info']

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()

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
    ]).then(([s, svcs]) => {
      setSalon(s)
      setServices(svcs)
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

  const getStepState = (s: Step): 'done' | 'active' | 'pending' => {
    if (step === 'done') return 'done'
    const current = stepOrder.indexOf(step)
    const target = stepOrder.indexOf(s)
    if (target < current) return 'done'
    if (target === current) return 'active'
    return 'pending'
  }

  if (notFound) {
    return (
      <div className="booking">
        <Card>
          <div className="dash__empty">
            <div className="dash__empty-icon">&#128566;</div>
            <p className="dash__empty-text">{t('errors.SALON_NOT_FOUND')}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!salon) return <div className="booking"><Spinner /></div>

  return (
    <div className="booking">
      <div className="booking__header">
        <div>
          <h1 className="booking__salon-name">{salon.name}</h1>
          {salon.address && (
            <p className="booking__salon-address">
              {salon.address}{salon.city ? `, ${salon.city}` : ''}
            </p>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {step !== 'done' && (
        <div className="booking__steps-wrapper">
          <div className="booking__steps">
            {stepOrder.map((s, i) => {
              const state = getStepState(s)
              return (
                <div key={s} className={`booking__step booking__step--${state}`}>
                  {i > 0 && (
                    <div className={`booking__step-line ${stepOrder.indexOf(step) >= i ? 'booking__step-line--done' : ''}`} />
                  )}
                  <span className="booking__step-num">{state === 'done' ? '\u2713' : i + 1}</span>
                </div>
              )
            })}
          </div>
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
            <div className="booking__success-action">
              <Button onClick={() => {
                setStep('service')
                setSelectedService(null)
                setSelectedSlot(null)
                setClientName('')
                setClientPhone('')
                setClientComment('')
              }}>
                {t('booking.title')}
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
                  <Spinner />
                ) : slots.length === 0 ? (
                  <p className="booking__no-slots">{t('booking.noSlots')}</p>
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
                  <Input label={t('booking.name')} value={clientName} onChange={e => setClientName(e.target.value)} required />
                  <PhoneInput label={t('booking.phone')} value={clientPhone} onChange={setClientPhone} required />
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
