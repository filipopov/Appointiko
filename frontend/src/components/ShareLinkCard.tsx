import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import Card from './ui/Card'
import './ShareLinkCard.css'

interface Props {
  slug: string
}

export default function ShareLinkCard({ slug }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const bookingUrl = `${window.location.origin}/booking/${slug}`

  useEffect(() => {
    if (showQR && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, bookingUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#2d2830', light: '#ffffff' },
      })
    }
  }, [showQR, bookingUrl])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = t('share.messageText', { url: bookingUrl })

  const viberUrl = `viber://forward?text=${encodeURIComponent(shareText)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <Card className="share-card">
      <div className="share-card__label">{t('share.title')}</div>
      <div className="share-card__url-row">
        <a className="share-card__url" href={bookingUrl} target="_blank" rel="noopener noreferrer">{bookingUrl}</a>
        <button className={`share-card__copy-btn ${copied ? 'share-card__copy-btn--copied' : ''}`} onClick={handleCopy}>
          {copied ? t('settings.copied') : t('settings.copy')}
        </button>
      </div>

      <div className="share-card__buttons">
        <a href={viberUrl} className="share-card__share-btn share-card__share-btn--viber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.47.07 5.2.5 3.05 2.5.53 4.93 0 8.66 0 12.51c0 3.85.53 7.58 3.05 9.99 0 0 0 0 0 0 1.77 1.63 4.84 2.14 6.53 2.3l.02.01c.26 0 .45-.2.45-.45v-1.97c0-.26-.18-.44-.44-.47-1.91-.18-3.37-.76-4.29-1.77C3.74 18.44 3.2 15.82 3.2 12.5c0-3.32.54-5.94 2.12-7.65.92-1.01 2.38-1.59 4.29-1.77.26-.03.44-.21.44-.47V.63c0-.26-.19-.46-.45-.45-.07 0-.14 0-.2.01zm1.2 0c-.07 0-.13 0-.2-.01-.26-.01-.45.19-.45.45v1.94c0 .26.18.44.44.47 1.91.18 3.37.76 4.29 1.77 1.58 1.71 2.12 4.33 2.12 7.65 0 3.32-.54 5.94-2.12 7.65-.92 1.01-2.38 1.59-4.29 1.77-.26.03-.44.21-.44.47v1.97c0 .25.19.45.45.45l.02-.01c1.69-.16 4.76-.67 6.53-2.3 2.52-2.41 3.05-6.14 3.05-9.99 0-3.85-.53-7.58-3.05-9.99C17.2.5 12.93.07 11.4 0zm-.4 4.98c-2.08.07-3.82.56-4.92 1.53C5.78 7.67 5.2 9.5 5.2 12.5c0 3 .58 4.83 1.88 5.99 1.1.97 2.84 1.46 4.92 1.53.26.01.48-.2.48-.46v-1.25c0-.24-.18-.44-.42-.46-1.5-.12-2.57-.47-3.24-1.06-.78-.69-1.22-1.86-1.22-4.29 0-2.43.44-3.6 1.22-4.29.67-.59 1.74-.94 3.24-1.06.24-.02.42-.22.42-.46V5.44c0-.26-.22-.47-.48-.46zm0 0c2.08.07 3.82.56 4.92 1.53 1.3 1.16 1.88 2.99 1.88 5.99 0 3-.58 4.83-1.88 5.99-1.1.97-2.84 1.46-4.92 1.53-.26.01-.48-.2-.48-.46v-1.25c0-.24.18-.44.42-.46 1.5-.12 2.57-.47 3.24-1.06.78-.69 1.22-1.86 1.22-4.29 0-2.43-.44-3.6-1.22-4.29-.67-.59-1.74-.94-3.24-1.06-.24-.02-.42-.22-.42-.46V5.44c0-.26.22-.47.48-.46zM12 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>
          Viber
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="share-card__share-btn share-card__share-btn--whatsapp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <button className="share-card__share-btn share-card__share-btn--qr" onClick={() => setShowQR(!showQR)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/></svg>
          QR
        </button>
      </div>

      {showQR && (
        <div className="share-card__qr">
          <canvas ref={canvasRef} className="share-card__qr-canvas" />
          <p className="share-card__qr-hint">{t('share.qrHint')}</p>
        </div>
      )}
    </Card>
  )
}
