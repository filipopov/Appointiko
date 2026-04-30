import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useToast } from './ui/Toast'
import './SalonImageUploader.css'

interface Props {
  slug: string | null | undefined
  imageUpdatedAt: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  onChange?: () => void
}

const MAX_BYTES = 2 * 1024 * 1024 // 2MB
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export default function SalonImageUploader({ slug, imageUpdatedAt, size = 'md', onChange }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const url = imageUpdatedAt && slug
    ? `/api/public/salons/${slug}/image?v=${encodeURIComponent(imageUpdatedAt)}`
    : null

  const pick = () => fileInput.current?.click()

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast(t('image.tooLarge'), 'error')
      return
    }
    if (!ACCEPT.split(',').includes(file.type)) {
      toast(t('image.unsupportedType'), 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLocalPreview(reader.result as string)
    reader.readAsDataURL(file)

    setBusy(true)
    try {
      await api.uploadSalonImage(file)
      toast(t('image.uploaded'), 'success')
      onChange?.()
    } catch (err: any) {
      toast(t(`errors.${err.code || 'UNKNOWN'}`), 'error')
      setLocalPreview(null)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(t('image.confirmRemove'))) return
    setBusy(true)
    try {
      await api.deleteSalonImage()
      setLocalPreview(null)
      toast(t('image.removed'), 'info')
      onChange?.()
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const display = localPreview || url

  return (
    <div className={`salon-img salon-img--${size}`}>
      <div className="salon-img__avatar" onClick={pick}>
        {display ? (
          <img src={display} alt="" />
        ) : (
          <div className="salon-img__placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="9" r="3.5" />
              <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
            </svg>
          </div>
        )}
        {busy && <div className="salon-img__busy" />}
      </div>
      <div className="salon-img__actions">
        <button type="button" className="salon-img__btn" onClick={pick} disabled={busy}>
          {display ? t('image.change') : t('image.upload')}
        </button>
        {display && (
          <button type="button" className="salon-img__btn salon-img__btn--danger" onClick={remove} disabled={busy}>
            {t('image.remove')}
          </button>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
