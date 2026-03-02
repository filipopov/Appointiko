import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import './CalendarPicker.css'

interface Props {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
  minDate?: string
}

function pad(n: number) { return n < 10 ? '0' + n : '' + n }

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function CalendarPicker({ value, onChange, minDate }: Props) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'mk'

  const selected = value ? new Date(value + 'T00:00:00') : new Date()
  const [viewYear, setViewYear] = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth()) // 0-indexed

  const todayStr = toYMD(new Date())

  // Weekday headers (Mon-Sun, ISO week)
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang, { weekday: 'short' })
    // Generate Mon(1)..Sun(7) using a known Monday: 2024-01-01 is a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i)
      return fmt.format(d).substring(0, 2)
    })
  }, [lang])

  // Month label
  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' })
    return fmt.format(new Date(viewYear, viewMonth, 1))
  }, [lang, viewYear, viewMonth])

  // Calendar grid cells
  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Day of week for first day (0=Sun..6=Sat) -> convert to Mon-based (0=Mon..6=Sun)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const result: (number | null)[] = []
    for (let i = 0; i < startDow; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) result.push(d)
    return result
  }, [viewYear, viewMonth])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  const handleSelect = (day: number) => {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    if (minDate && dateStr < minDate) return
    onChange(dateStr)
  }

  return (
    <div className="cal">
      <div className="cal__header">
        <button type="button" className="cal__nav" onClick={prevMonth}>&lsaquo;</button>
        <span className="cal__month-label">{monthLabel}</span>
        <button type="button" className="cal__nav" onClick={nextMonth}>&rsaquo;</button>
      </div>

      <div className="cal__weekdays">
        {weekdays.map((wd, i) => (
          <div key={i} className="cal__weekday">{wd}</div>
        ))}
      </div>

      <div className="cal__grid">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="cal__cell cal__cell--empty" />
          }
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
          const isToday = dateStr === todayStr
          const isSelected = dateStr === value
          const isDisabled = !!(minDate && dateStr < minDate)

          const cls = [
            'cal__cell',
            isDisabled ? 'cal__cell--disabled' : 'cal__cell--active',
            isToday ? 'cal__cell--today' : '',
            isSelected ? 'cal__cell--selected' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => !isDisabled && handleSelect(day)}
              disabled={isDisabled}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
