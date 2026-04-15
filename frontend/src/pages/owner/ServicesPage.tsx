import { useState, useEffect, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AuthContext } from '../../App'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import UpgradePrompt from '../../components/UpgradePrompt'
import { useToast } from '../../components/ui/Toast'
import './ServicesPage.css'

export default function ServicesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { user } = useContext(AuthContext)
  const [services, setServices] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState(0)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = () => {
    api.getServices().then(setServices).catch(() => {})
  }

  useEffect(load, [])

  const [limitReached, setLimitReached] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      if (editing?.id) {
        await api.updateService(editing.id, { name, durationMinutes: duration, price, active: true, displayOrder: editing.displayOrder || 0 })
      } else {
        await api.createService({ name, durationMinutes: duration, price, active: true, displayOrder: services.length })
      }
      setLimitReached(false)
      resetForm()
      load()
      toast(t('settings.saved'))
    } catch (err: any) {
      if (err?.code === 'PLAN_LIMIT_REACHED') {
        setLimitReached(true)
      } else {
        toast(t(`errors.${err?.code || 'UNKNOWN'}`), 'error')
      }
    }
  }

  const handleDelete = async () => {
    if (deleteId == null) return
    await api.deleteService(deleteId)
    setDeleteId(null)
    load()
    toast(t('services.deleted'), 'info')
  }

  const startEdit = (s: any) => {
    setEditing(s)
    setName(s.name)
    setDuration(s.durationMinutes)
    setPrice(s.price)
  }

  const resetForm = () => {
    setEditing(null)
    setName('')
    setDuration(30)
    setPrice(0)
  }

  return (
    <OwnerLayout>
      <h2 className="svc__title">{t('services.title')}</h2>

      {limitReached && <UpgradePrompt type="service-limit" />}

      <Card className="svc__form">
        <div className="svc__form-fields">
          <Input label={t('services.name')} value={name} onChange={e => setName(e.target.value)} />
          <div className="svc__form-row">
            <Input label={t('services.duration')} type="number" min={1} value={duration} onChange={e => setDuration(+e.target.value)} />
            <Input label={t('services.price')} type="number" min={0} value={price} onChange={e => setPrice(+e.target.value)} />
          </div>
          <div className="svc__form-actions">
            <Button onClick={handleSave}>{t('services.save')}</Button>
            {editing && <Button variant="secondary" onClick={resetForm}>{t('services.cancelEdit')}</Button>}
          </div>
        </div>
      </Card>

      {services.length === 0 ? (
        <p className="svc__empty">{t('services.noServices')}</p>
      ) : (
        <div className="svc__list">
          {services.map(s => (
            <Card key={s.id} className="svc__item">
              <div>
                <div className="svc__item-name">{s.name}</div>
                <div className="svc__item-meta">
                  {s.durationMinutes} min &middot; {s.price} ден
                </div>
              </div>
              <div className="svc__item-actions">
                <Button variant="secondary" size="sm" onClick={() => startEdit(s)}>
                  {t('services.edit')}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteId(s.id)}>
                  {t('services.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteId != null && (
        <ConfirmDialog
          message={t('services.confirmDelete')}
          confirmLabel={t('services.delete')}
          cancelLabel={t('services.cancelEdit')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </OwnerLayout>
  )
}
