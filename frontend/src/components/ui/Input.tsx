import { InputHTMLAttributes } from 'react'
import './Input.css'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className = '', ...props }: Props) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-group__label">{label}</label>}
      <input className="input-group__field" {...props} />
    </div>
  )
}
