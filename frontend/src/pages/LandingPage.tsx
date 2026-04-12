import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import MobileMenu from '../components/MobileMenu'
import './LandingPage.css'

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = el.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    targets.forEach(t => observer.observe(t))
    return () => observer.disconnect()
  }, [])
  return ref
}

export default function LandingPage() {
  const { t } = useTranslation()
  const wrapperRef = useScrollReveal()

  return (
    <div className="landing" ref={wrapperRef}>
      {/* Animated gradient orb */}
      <div className="landing__orb" />

      <header className="landing__header hero-fade hero-fade--1">
        <Link to="/" className="landing__brand"><Logo size={28} /> Appointiko</Link>
        <div className="landing__header-right">
          <div className="desktop-only">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <Link to="/login" className="landing__login-link">{t('auth.login')}</Link>
          <MobileMenu />
        </div>
      </header>

      <section className="landing__hero">
        <h1 className="landing__hero-title hero-fade hero-fade--2">{t('landing.heroTitle')}</h1>
        <p className="landing__hero-subtitle hero-fade hero-fade--3">{t('landing.heroSubtitle')}</p>
        <div className="landing__hero-buttons hero-fade hero-fade--4">
          <Link to="/register" className="landing__cta-btn landing__cta-btn--shimmer">{t('landing.cta')}</Link>
          <Link to="/explore" className="landing__explore-btn">{t('landing.exploreSalons')}</Link>
        </div>
        <p className="landing__hero-free hero-fade hero-fade--5">{t('landing.free')}</p>
      </section>

      <section className="landing__steps">
        <h2 className="landing__section-title reveal">{t('landing.howItWorks')}</h2>
        <div className="landing__steps-grid">
          <div className="landing__step reveal reveal--delay-1">
            <div className="landing__step-num">1</div>
            <h3 className="landing__step-title">{t('landing.step1Title')}</h3>
            <p className="landing__step-desc">{t('landing.step1Desc')}</p>
          </div>
          <div className="landing__step reveal reveal--delay-2">
            <div className="landing__step-num">2</div>
            <h3 className="landing__step-title">{t('landing.step2Title')}</h3>
            <p className="landing__step-desc">{t('landing.step2Desc')}</p>
          </div>
          <div className="landing__step reveal reveal--delay-3">
            <div className="landing__step-num">3</div>
            <h3 className="landing__step-title">{t('landing.step3Title')}</h3>
            <p className="landing__step-desc">{t('landing.step3Desc')}</p>
          </div>
        </div>
      </section>

      <section className="landing__features">
        <h2 className="landing__section-title reveal">{t('landing.featuresTitle')}</h2>
        <div className="landing__features-grid">
          <div className="landing__feature reveal reveal--delay-1">
            <div className="landing__feature-icon">&#128197;</div>
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Desc')}</p>
          </div>
          <div className="landing__feature reveal reveal--delay-2">
            <div className="landing__feature-icon">&#128241;</div>
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Desc')}</p>
          </div>
          <div className="landing__feature reveal reveal--delay-3">
            <div className="landing__feature-icon">&#128176;</div>
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Desc')}</p>
          </div>
          <div className="landing__feature reveal reveal--delay-4">
            <div className="landing__feature-icon">&#127760;</div>
            <h3>{t('landing.feature4Title')}</h3>
            <p>{t('landing.feature4Desc')}</p>
          </div>
        </div>
      </section>

      <section className="landing__bottom-cta reveal">
        <h2>{t('landing.bottomCtaTitle')}</h2>
        <p>{t('landing.bottomCtaDesc')}</p>
        <Link to="/register" className="landing__cta-btn landing__cta-btn--shimmer">{t('landing.cta')}</Link>
      </section>

      <footer className="landing__footer">
        <span>Appointiko &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
