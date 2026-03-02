import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.css'

const langs = [
  { code: 'mk', label: 'МК' },
  { code: 'en', label: 'EN' },
  { code: 'sq', label: 'SQ' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="lang-switcher">
      {langs.map(l => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`lang-switcher__btn ${i18n.language === l.code ? 'lang-switcher__btn--active' : ''}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
