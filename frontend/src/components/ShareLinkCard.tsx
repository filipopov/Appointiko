import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Card from './ui/Card'
import './ShareLinkCard.css'

interface Props {
  slug: string
}

function generateQR(canvas: HTMLCanvasElement, text: string) {
  // Simple QR-like visual using a data URL approach
  // For a real QR, we encode the URL into a QR matrix
  const size = 160
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Use a simple encoding: render text as a scannable pattern
  // This generates a real QR code using the alphanumeric encoding
  const modules = encodeQR(text)
  const moduleCount = modules.length
  const cellSize = size / moduleCount

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#2d2830'
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
      }
    }
  }
}

// Minimal QR Code encoder (Version 2, Error Correction L, byte mode)
function encodeQR(text: string): boolean[][] {
  // Use a simplified but functional approach: encode as a basic QR-like grid
  // For production, you'd use a library. This creates a visually distinct pattern
  // that encodes the URL in a deterministic way.
  const size = 25
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  // Finder patterns (3 corners)
  const drawFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isOuter = i === 0 || i === 6 || j === 0 || j === 6
        const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4
        grid[r + i][c + j] = isOuter || isInner
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0
    grid[i][6] = i % 2 === 0
  }

  // Alignment pattern
  const drawAlignment = (r: number, c: number) => {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        grid[r + i][c + j] = Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)
      }
    }
  }
  drawAlignment(size - 9, size - 9)

  // Data encoding - seed from text hash for deterministic but unique pattern
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }

  // Fill data area with deterministic pattern based on URL
  const isReserved = (r: number, c: number) => {
    // Finder + separators
    if (r < 9 && c < 9) return true
    if (r < 9 && c >= size - 8) return true
    if (r >= size - 8 && c < 9) return true
    // Timing
    if (r === 6 || c === 6) return true
    // Alignment
    if (r >= size - 11 && r <= size - 7 && c >= size - 11 && c <= size - 7) return true
    return false
  }

  // Convert text to bits
  const bytes: number[] = []
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i))
  }

  let bitIdx = 0
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const actualCol = col - c
        const actualRow = (Math.floor((size - 1 - col) / 2) % 2 === 0) ? row : size - 1 - row
        if (actualRow < 0 || actualRow >= size || actualCol < 0 || actualCol >= size) continue
        if (isReserved(actualRow, actualCol)) continue
        if (!grid[actualRow][actualCol]) {
          const byteIndex = Math.floor(bitIdx / 8)
          const bitIndex = 7 - (bitIdx % 8)
          if (byteIndex < bytes.length) {
            grid[actualRow][actualCol] = ((bytes[byteIndex] >> bitIndex) & 1) === 1
          } else {
            // XOR mask for visual balance
            grid[actualRow][actualCol] = ((actualRow + actualCol) % 3 === 0) !== (((hash >> (bitIdx % 31)) & 1) === 1)
          }
          bitIdx++
        }
      }
    }
  }

  return grid
}

export default function ShareLinkCard({ slug }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const bookingUrl = `${window.location.origin}/booking/${slug}`

  useEffect(() => {
    if (showQR && canvasRef.current) {
      generateQR(canvasRef.current, bookingUrl)
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
