import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMkPhone, isValidMkPhone, cleanPhone } from '../../utils/phone'
import './PhoneInput.css'

interface Props {
  label?: string
  value: string
  onChange: (cleanedValue: string) => void
  required?: boolean
}

export default function PhoneInput({ label, value, onChange, required }: Props) {
  const { t } = useTranslation()
  const [touched, setTouched] = useState(false)

  const displayValue = formatMkPhone(value)
  const cleaned = cleanPhone(value)
  const showError = touched && cleaned.length > 0 && !isValidMkPhone(cleaned)

  const handleChange = (raw: string) => {
    // Only allow digits and spaces
    const digits = raw.replace(/\D/g, '')
    // Limit to 9 digits (07XXXXXXX)
    const trimmed = digits.substring(0, 9)
    onChange(trimmed)
  }

  return (
    <div className={`phone-input ${showError ? 'phone-input--invalid' : ''}`}>
      {label && <label className="phone-input__label">{label}</label>}
      <div className="phone-input__row">
        <span className="phone-input__prefix">+389</span>
        <input
          type="tel"
          className="phone-input__field"
          value={displayValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="07X XXX XXX"
          required={required}
        />
      </div>
      {showError && <span className="phone-input__error">{t('errors.INVALID_PHONE')}</span>}
    </div>
  )
}
