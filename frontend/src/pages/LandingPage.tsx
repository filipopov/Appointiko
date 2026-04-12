import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="landing">
      <header className="landing__header">
        <span className="landing__brand">Appointiko</span>
        <div className="landing__header-right">
          <LanguageSwitcher />
          <Link to="/login" className="landing__login-link">{t('auth.login')}</Link>
        </div>
      </header>

      <section className="landing__hero">
        <h1 className="landing__hero-title">{t('landing.heroTitle')}</h1>
        <p className="landing__hero-subtitle">{t('landing.heroSubtitle')}</p>
        <div className="landing__hero-buttons">
          <Link to="/register" className="landing__cta-btn">{t('landing.cta')}</Link>
          <Link to="/explore" className="landing__explore-btn">{t('landing.exploreSalons')}</Link>
        </div>
        <p className="landing__hero-free">{t('landing.free')}</p>
      </section>

      <section className="landing__steps">
        <h2 className="landing__section-title">{t('landing.howItWorks')}</h2>
        <div className="landing__steps-grid">
          <div className="landing__step">
            <div className="landing__step-num">1</div>
            <h3 className="landing__step-title">{t('landing.step1Title')}</h3>
            <p className="landing__step-desc">{t('landing.step1Desc')}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-num">2</div>
            <h3 className="landing__step-title">{t('landing.step2Title')}</h3>
            <p className="landing__step-desc">{t('landing.step2Desc')}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-num">3</div>
            <h3 className="landing__step-title">{t('landing.step3Title')}</h3>
            <p className="landing__step-desc">{t('landing.step3Desc')}</p>
          </div>
        </div>
      </section>

      <section className="landing__features">
        <h2 className="landing__section-title">{t('landing.featuresTitle')}</h2>
        <div className="landing__features-grid">
          <div className="landing__feature">
            <div className="landing__feature-icon">&#128197;</div>
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Desc')}</p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">&#128241;</div>
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Desc')}</p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">&#128176;</div>
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Desc')}</p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">&#127760;</div>
            <h3>{t('landing.feature4Title')}</h3>
            <p>{t('landing.feature4Desc')}</p>
          </div>
        </div>
      </section>

      <section className="landing__bottom-cta">
        <h2>{t('landing.bottomCtaTitle')}</h2>
        <p>{t('landing.bottomCtaDesc')}</p>
        <Link to="/register" className="landing__cta-btn">{t('landing.cta')}</Link>
      </section>

      <footer className="landing__footer">
        <span>Appointiko &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
