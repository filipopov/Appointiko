import { ButtonHTMLAttributes } from 'react'
import './Button.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  fullWidth?: boolean
  size?: 'sm'
}

export default function Button({ variant = 'primary', fullWidth, size, className = '', ...props }: Props) {
  const cls = [
    'btn',
    `btn--${variant}`,
    fullWidth ? 'btn--full' : '',
    size ? `btn--${size}` : '',
    className,
  ].filter(Boolean).join(' ')

  return <button className={cls} {...props} />
}
