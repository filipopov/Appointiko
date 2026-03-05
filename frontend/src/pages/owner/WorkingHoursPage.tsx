import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import './WorkingHoursPage.css'

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
    </OwnerLayout>
  )
}
