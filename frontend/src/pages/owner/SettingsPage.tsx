import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import OwnerLayout from '../../components/OwnerLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ShareLinkCard from '../../components/ShareLinkCard'
import './SettingsPage.css'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [slug, setSlug] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSalon().then((s: any) => {
      setName(s.name || '')
      setCity(s.city || '')
      setAddress(s.address || '')
      setPhone(s.phone || '')
      setInstagram(s.instagram || '')
      setSlug(s.slug || '')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    await api.updateSalon({ name, city, address, phone, instagram })
    setSaved(true)
  }

  return (
    <OwnerLayout>
      <h2 className="settings__title">{t('settings.title')}</h2>

      <Card className="settings__form">
        <div className="settings__fields">
          <Input label={t('settings.name')} value={name} onChange={e => { setName(e.target.value); setSaved(false) }} />
          <Input label={t('settings.city')} value={city} onChange={e => { setCity(e.target.value); setSaved(false) }} />
          <Input label={t('settings.address')} value={address} onChange={e => { setAddress(e.target.value); setSaved(false) }} />
          <Input label={t('settings.phone')} value={phone} onChange={e => { setPhone(e.target.value); setSaved(false) }} />
          <Input label={t('settings.instagram')} value={instagram} onChange={e => { setInstagram(e.target.value); setSaved(false) }} placeholder="@yoursalon" />
          <div className="settings__save-row">
            <Button onClick={handleSave}>{t('settings.save')}</Button>
            {saved && <span className="settings__saved">{t('settings.saved')}</span>}
          </div>
        </div>
      </Card>

      {slug && <ShareLinkCard slug={slug} />}
    </OwnerLayout>
  )
}
