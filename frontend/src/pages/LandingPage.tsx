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
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
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
        <h1 className="landing__hero-title hero-fade hero-fade--2">
          <span className="landing__hero-gradient">{t('landing.heroTitle')}</span>
        </h1>
        <p className="landing__hero-subtitle hero-fade hero-fade--3">{t('landing.heroSubtitle')}</p>
        <div className="landing__hero-buttons hero-fade hero-fade--4">
          <Link to="/register" className="landing__cta-btn landing__cta-btn--shimmer">{t('landing.cta')}</Link>
          <Link to="/explore" className="landing__explore-btn">{t('landing.exploreSalons')}</Link>
        </div>
        <p className="landing__hero-free hero-fade hero-fade--5">{t('landing.free')}</p>
      </section>

      <section className="landing__steps">
        <div className="landing__orb-steps" />
        <h2 className="landing__section-title reveal">{t('landing.howItWorks')}</h2>
        <div className="landing__steps-grid">
          <div className="landing__step reveal reveal--left reveal--delay-1">
            <div className="landing__step-num landing__step-num--pop">1</div>
            <h3 className="landing__step-title">{t('landing.step1Title')}</h3>
            <p className="landing__step-desc">{t('landing.step1Desc')}</p>
          </div>
          <div className="landing__step reveal reveal--up reveal--delay-2">
            <div className="landing__step-num landing__step-num--pop">2</div>
            <h3 className="landing__step-title">{t('landing.step2Title')}</h3>
            <p className="landing__step-desc">{t('landing.step2Desc')}</p>
          </div>
          <div className="landing__step reveal reveal--right reveal--delay-3">
            <div className="landing__step-num landing__step-num--pop">3</div>
            <h3 className="landing__step-title">{t('landing.step3Title')}</h3>
            <p className="landing__step-desc">{t('landing.step3Desc')}</p>
          </div>
        </div>
      </section>

      <section className="landing__features">
        <div className="landing__orb-features" />
        <h2 className="landing__section-title reveal">{t('landing.featuresTitle')}</h2>
        <div className="landing__features-grid">
          <div className="landing__feature reveal reveal--left reveal--delay-1">
            <div className="landing__feature-icon landing__feature-icon--bounce">&#128197;</div>
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Desc')}</p>
          </div>
          <div className="landing__feature reveal reveal--right reveal--delay-2">
            <div className="landing__feature-icon landing__feature-icon--bounce">&#128241;</div>
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Desc')}</p>
          </div>
          <div className="landing__feature reveal reveal--left reveal--delay-3">
            <div className="landing__feature-icon landing__feature-icon--bounce">&#128176;</div>
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Desc')}</p>
          </div>
          <div className="landing__feature reveal reveal--right reveal--delay-4">
            <div className="landing__feature-icon landing__feature-icon--bounce">&#127760;</div>
            <h3>{t('landing.feature4Title')}</h3>
            <p>{t('landing.feature4Desc')}</p>
          </div>
        </div>
      </section>

      <section className="landing__bottom-cta">
        <div className="landing__orb-cta" />
        <h2 className="reveal">{t('landing.bottomCtaTitle')}</h2>
        <p className="reveal reveal--delay-1">{t('landing.bottomCtaDesc')}</p>
        <div className="reveal reveal--delay-2">
          <Link to="/register" className="landing__cta-btn landing__cta-btn--shimmer">{t('landing.cta')}</Link>
        </div>
      </section>

      <footer className="landing__footer reveal">
        <span>Appointiko &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
