export default function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#c0567a" />
      <path
        d="M10 8h4v3a6 6 0 01-1.5 4L11 17v5a2 2 0 004 0v-5l-1.5-2A6 6 0 0112 11V8"
        fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="11" y="6" width="2" height="3" rx="1" fill="#fff" opacity="0.8" />
      <circle cx="21" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M21 10v4l2-1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 20h6M19 23h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
