import './Skeleton.css'

interface Props {
  rows?: number
  height?: number
}

export default function Skeleton({ rows = 3, height = 72 }: Props) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-item" style={{ height }} />
      ))}
    </div>
  )
}
