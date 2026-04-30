import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import './WorkingHoursPage.css'

interface Override {
  date: string
  isWorkingDay: boolean
  blocks: { startTime: string; endTime: string }[]
}

const dayKeys = ['hours.monday', 'hours.tuesday', 'hours.wednesday', 'hours.thursday', 'hours.friday', 'hours.saturday', 'hours.sunday']

interface TimeBlock {
  startTime: string
  endTime: string
}

interface DayHours {
  dayOfWeek: number
  isWorkingDay: boolean
  blocks: TimeBlock[]
}

export default function WorkingHoursPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [hours, setHours] = useState<DayHours[]>([])

  useEffect(() => {
    api.getWorkingHours().then((data: any[]) => {
      if (data.length === 7) {
        setHours(data.map((d: any) => ({
          dayOfWeek: d.dayOfWeek,
          isWorkingDay: d.isWorkingDay,
          blocks: (d.blocks && d.blocks.length > 0)
            ? d.blocks.map((b: any) => ({
                startTime: (b.startTime || '09:00').substring(0, 5),
                endTime: (b.endTime || '17:00').substring(0, 5),
              }))
            : [{ startTime: '09:00', endTime: '17:00' }],
        })))
      } else {
        setHours(Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i + 1,
          isWorkingDay: i < 5,
          blocks: [{ startTime: '09:00', endTime: '17:00' }],
        })))
      }
    }).catch(() => {})
  }, [])

  const toggleDay = (idx: number, checked: boolean) => {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, isWorkingDay: checked } : h))
  }

  const updateBlock = (dayIdx: number, blockIdx: number, field: keyof TimeBlock, value: string) => {
    setHours(prev => prev.map((h, i) => {
      if (i !== dayIdx) return h
      const blocks = h.blocks.map((b, bi) => bi === blockIdx ? { ...b, [field]: value } : b)
      return { ...h, blocks }
    }))
  }

  const addBlock = (dayIdx: number) => {
    setHours(prev => prev.map((h, i) => {
      if (i !== dayIdx) return h
      const last = h.blocks[h.blocks.length - 1]
      return { ...h, blocks: [...h.blocks, { startTime: last?.endTime || '13:00', endTime: '21:00' }] }
    }))
  }

  const removeBlock = (dayIdx: number, blockIdx: number) => {
    setHours(prev => prev.map((h, i) => {
      if (i !== dayIdx) return h
      const blocks = h.blocks.filter((_, bi) => bi !== blockIdx)
      return { ...h, blocks: blocks.length > 0 ? blocks : [{ startTime: '09:00', endTime: '17:00' }] }
    }))
  }

  const handleSave = async () => {
    await api.setWorkingHours({ days: hours })
    toast(t('settings.saved'))
  }

  return (
    <OwnerLayout>
      <h2 className="wh-title">{t('hours.title')}</h2>

      <div className="wh-list">
        {hours.map((h, idx) => (
          <Card key={h.dayOfWeek} className={`wh-day-card ${h.isWorkingDay ? '' : 'wh-day-card--off'}`}>
            <label className="wh-day-header">
              <input
                type="checkbox"
                checked={h.isWorkingDay}
                onChange={e => toggleDay(idx, e.target.checked)}
              />
              <span className="wh-day-name">{t(dayKeys[idx])}</span>
            </label>
            {h.isWorkingDay && (
              <div className="wh-blocks">
                {h.blocks.map((block, bi) => (
                  <div key={bi} className="wh-block-row">
                    <input
                      type="time"
                      value={block.startTime}
                      onChange={e => updateBlock(idx, bi, 'startTime', e.target.value)}
                      className="wh-time-input"
                    />
                    <span className="wh-separator">-</span>
                    <input
                      type="time"
                      value={block.endTime}
                      onChange={e => updateBlock(idx, bi, 'endTime', e.target.value)}
                      className="wh-time-input"
                    />
                    {h.blocks.length > 1 && (
                      <button className="wh-remove-btn" onClick={() => removeBlock(idx, bi)} title={t('hours.removeBlock')}>
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button className="wh-add-btn" onClick={() => addBlock(idx)}>
                  + {t('hours.addBlock')}
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="wh-save-row">
        <Button onClick={handleSave}>{t('hours.save')}</Button>
      </div>

      <DateOverrides />
    </OwnerLayout>
  )
}

function DateOverrides() {
  const { t } = useTranslation()
  const toast = useToast()
  const [overrides, setOverrides] = useState<Override[]>([])
  const [date, setDate] = useState<string>('')
  const [isWorking, setIsWorking] = useState(true)
  const [blocks, setBlocks] = useState<{ startTime: string; endTime: string }[]>([
    { startTime: '09:00', endTime: '17:00' },
  ])
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.getHoursOverrides().then((data: any[]) => {
      setOverrides(data.map((d: any) => ({
        date: d.date,
        isWorkingDay: d.isWorkingDay,
        blocks: (d.blocks || []).map((b: any) => ({
          startTime: (b.startTime || '09:00').substring(0, 5),
          endTime: (b.endTime || '17:00').substring(0, 5),
        })),
      })))
    }).catch(() => {})
  }

  useEffect(load, [])

  const updateBlock = (i: number, field: 'startTime' | 'endTime', value: string) => {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }

  const addBlock = () => {
    const last = blocks[blocks.length - 1]
    setBlocks(prev => [...prev, { startTime: last?.endTime || '13:00', endTime: '21:00' }])
  }

  const removeBlock = (i: number) => {
    setBlocks(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)
  }

  const save = async () => {
    if (!date) return
    setSaving(true)
    try {
      await api.setHoursOverride({ date, isWorkingDay: isWorking, blocks: isWorking ? blocks : [] })
      toast(t('settings.saved'), 'success')
      setDate('')
      setIsWorking(true)
      setBlocks([{ startTime: '09:00', endTime: '17:00' }])
      load()
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (d: string) => {
    if (!confirm(t('hours.confirmRemoveOverride'))) return
    try {
      await api.deleteHoursOverride(d)
      load()
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="wh-overrides">
      <h3 className="wh-overrides__title">{t('hours.overridesTitle')}</h3>
      <p className="wh-overrides__desc">{t('hours.overridesDesc')}</p>

      <Card className="wh-overrides__form">
        <div className="wh-overrides__row">
          <input
            type="date"
            min={today}
            value={date}
            onChange={e => setDate(e.target.value)}
            className="wh-time-input"
          />
          <label className="wh-overrides__toggle">
            <input
              type="checkbox"
              checked={isWorking}
              onChange={e => setIsWorking(e.target.checked)}
            />
            {t('hours.openOnDate')}
          </label>
        </div>
        {isWorking && (
          <div className="wh-blocks">
            {blocks.map((block, bi) => (
              <div key={bi} className="wh-block-row">
                <input type="time" value={block.startTime} onChange={e => updateBlock(bi, 'startTime', e.target.value)} className="wh-time-input" />
                <span className="wh-separator">-</span>
                <input type="time" value={block.endTime} onChange={e => updateBlock(bi, 'endTime', e.target.value)} className="wh-time-input" />
                {blocks.length > 1 && (
                  <button className="wh-remove-btn" onClick={() => removeBlock(bi)} title={t('hours.removeBlock')}>×</button>
                )}
              </div>
            ))}
            <button className="wh-add-btn" onClick={addBlock}>+ {t('hours.addBlock')}</button>
          </div>
        )}
        <Button onClick={save} disabled={!date || saving}>{t('hours.saveOverride')}</Button>
      </Card>

      {overrides.length > 0 && (
        <div className="wh-overrides__list">
          {overrides.map(o => (
            <Card key={o.date} className="wh-overrides__item">
              <div className="wh-overrides__item-info">
                <strong>{new Date(o.date + 'T00:00:00').toLocaleDateString()}</strong>
                <span>
                  {o.isWorkingDay
                    ? o.blocks.map(b => `${b.startTime}–${b.endTime}`).join(', ')
                    : t('hours.closed')}
                </span>
              </div>
              <button className="wh-remove-btn" onClick={() => remove(o.date)} title={t('hours.removeOverride')}>×</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
