import './SalonImageUploader.css'

interface Props {
  slug: string | null | undefined
  imageUpdatedAt: string | null | undefined
  name: string
  size?: number
}

/**
 * Read-only avatar — used outside the uploader (dashboard header, explore cards, map markers).
 * Falls back to the salon's first letter on a tinted disc when no image is set.
 */
export default function SalonAvatar({ slug, imageUpdatedAt, name, size = 32 }: Props) {
  const url = imageUpdatedAt && slug
    ? `/api/public/salons/${slug}/image?v=${encodeURIComponent(imageUpdatedAt)}`
    : null

  return (
    <span className="salon-avatar" style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt="" loading="lazy" />
      ) : (
        <span className="salon-avatar__fallback" style={{ fontSize: Math.round(size * 0.45) }}>
          {(name?.charAt(0) || '?').toUpperCase()}
        </span>
      )}
    </span>
  )
}
