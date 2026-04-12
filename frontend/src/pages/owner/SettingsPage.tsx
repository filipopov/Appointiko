import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ShareLinkCard from '../../components/ShareLinkCard'
import { useToast } from '../../components/ui/Toast'
import './SettingsPage.css'

export default function SettingsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    api.getSalon().then((s: any) => {
      setName(s.name || '')
      setCity(s.city || '')
      setAddress(s.address || '')
      setPhone(s.phone || '')
      setInstagram(s.instagram || '')
      setDescription(s.description || '')
      setLatitude(s.latitude != null ? String(s.latitude) : '')
      setLongitude(s.longitude != null ? String(s.longitude) : '')
      setSlug(s.slug || '')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    await api.updateSalon({
      name, city, address, phone, instagram, description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    })
    toast(t('settings.saved'))
  }

  return (
    <OwnerLayout>
      <h2 className="settings__title">{t('settings.title')}</h2>

      <Card className="settings__form">
        <div className="settings__fields">
          <Input label={t('settings.name')} value={name} onChange={e => setName(e.target.value)} />
          <Input label={t('settings.city')} value={city} onChange={e => setCity(e.target.value)} />
          <Input label={t('settings.address')} value={address} onChange={e => setAddress(e.target.value)} />
          <Input label={t('settings.phone')} value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label={t('settings.instagram')} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yoursalon" />
          <div className="settings__textarea-group">
            <label className="settings__label">{t('settings.description')}</label>
            <textarea
              className="settings__textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('settings.descriptionPlaceholder')}
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="settings__row">
            <Input label={t('settings.latitude')} value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="41.9981" />
            <Input label={t('settings.longitude')} value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="21.4254" />
          </div>
          <p className="settings__hint">{t('settings.locationHint')}</p>
          <Button onClick={handleSave}>{t('settings.save')}</Button>
        </div>
      </Card>

      {slug && <ShareLinkCard slug={slug} />}
    </OwnerLayout>
  )
}
