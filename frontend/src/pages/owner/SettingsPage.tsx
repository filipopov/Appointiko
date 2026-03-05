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
  const [slug, setSlug] = useState('')

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
          <Button onClick={handleSave}>{t('settings.save')}</Button>
        </div>
      </Card>

      {slug && <ShareLinkCard slug={slug} />}
    </OwnerLayout>
  )
}
