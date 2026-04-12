import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './ExplorePage.css'

interface Salon {
  id: number
  name: string
  slug: string
  city: string | null
  address: string | null
  phone: string | null
  instagram: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  promoted: boolean
}

type ViewMode = 'grid' | 'map'

// Default center: Skopje
const DEFAULT_CENTER: [number, number] = [41.9981, 21.4254]
const DEFAULT_ZOOM = 13

export default function ExplorePage() {
  const { t } = useTranslation()
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('grid')
  const [cityFilter, setCityFilter] = useState('')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    api.exploreSalons().then((data) => {
      setSalons(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const cities = Array.from(new Set(salons.map(s => s.city).filter(Boolean) as string[]))

  const filtered = cityFilter
    ? salons.filter(s => s.city === cityFilter)
    : salons

  const promoted = filtered.filter(s => s.promoted)
  const regular = filtered.filter(s => !s.promoted)

  // Map initialization and update
  useEffect(() => {
    if (view !== 'map' || !mapRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
      markersRef.current = L.layerGroup().addTo(mapInstanceRef.current)
    }

    // Invalidate size after render (tab switch)
    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100)

    // Update markers
    markersRef.current?.clearLayers()

    const salonsWithCoords = filtered.filter(s => s.latitude && s.longitude)

    salonsWithCoords.forEach(salon => {
      const icon = L.divIcon({
        className: `explore__marker ${salon.promoted ? 'explore__marker--promoted' : ''}`,
        html: `<div class="explore__marker-dot">${salon.promoted ? '&#9733;' : ''}</div>`,
        iconSize: [salon.promoted ? 36 : 28, salon.promoted ? 36 : 28],
        iconAnchor: [salon.promoted ? 18 : 14, salon.promoted ? 18 : 14],
      })

      const marker = L.marker([salon.latitude!, salon.longitude!], { icon })
      marker.bindPopup(`
        <div class="explore__popup">
          <strong>${salon.name}</strong>
          ${salon.city ? `<br><span>${salon.city}</span>` : ''}
          ${salon.address ? `<br><small>${salon.address}</small>` : ''}
          <br><a href="/booking/${salon.slug}">${t('explore.bookNow')}</a>
        </div>
      `)
      markersRef.current?.addLayer(marker)
    })

    // Fit bounds if salons exist
    if (salonsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        salonsWithCoords.map(s => [s.latitude!, s.longitude!] as [number, number])
      )
      mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [view, filtered, t])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersRef.current = null
      }
    }
  }, [])

  return (
    <div className="explore">
      <header className="explore__header">
        <Link to="/" className="explore__brand"><Logo size={28} /> Appointiko</Link>
        <div className="explore__header-right">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link to="/login" className="explore__login-link">{t('auth.login')}</Link>
        </div>
      </header>

      <section className="explore__hero">
        <h1 className="explore__title">{t('explore.title')}</h1>
        <p className="explore__subtitle">{t('explore.subtitle')}</p>
      </section>

      <div className="explore__controls">
        <div className="explore__filter">
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="explore__city-select"
          >
            <option value="">{t('explore.allCities')}</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="explore__view-toggle">
          <button
            className={`explore__view-btn ${view === 'grid' ? 'explore__view-btn--active' : ''}`}
            onClick={() => setView('grid')}
          >
            &#9638; {t('explore.gridView')}
          </button>
          <button
            className={`explore__view-btn ${view === 'map' ? 'explore__view-btn--active' : ''}`}
            onClick={() => setView('map')}
          >
            &#9873; {t('explore.mapView')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="explore__loading">
          <div className="explore__spinner" />
        </div>
      ) : (
        <>
          {/* Map View */}
          {view === 'map' && (
            <div className="explore__map-container">
              <div ref={mapRef} className="explore__map" />
            </div>
          )}

          {/* Grid View */}
          {view === 'grid' && (
            <div className="explore__content">
              {/* Promoted Section */}
              {promoted.length > 0 && (
                <section className="explore__section">
                  <h2 className="explore__section-title">
                    <span className="explore__star">&#9733;</span> {t('explore.featured')}
                  </h2>
                  <div className="explore__grid explore__grid--promoted">
                    {promoted.map(salon => (
                      <SalonCard key={salon.id} salon={salon} promoted t={t} />
                    ))}
                  </div>
                </section>
              )}

              {/* All Salons */}
              <section className="explore__section">
                <h2 className="explore__section-title">{t('explore.allSalons')}</h2>
                {regular.length === 0 && promoted.length === 0 ? (
                  <p className="explore__empty">{t('explore.noSalons')}</p>
                ) : (
                  <div className="explore__grid">
                    {regular.map(salon => (
                      <SalonCard key={salon.id} salon={salon} t={t} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      <footer className="explore__footer">
        <span>Appointiko &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}

function SalonCard({ salon, promoted, t }: { salon: Salon; promoted?: boolean; t: any }) {
  return (
    <Link to={`/booking/${salon.slug}`} className={`explore__card ${promoted ? 'explore__card--promoted' : ''}`}>
      <div className="explore__card-top">
        <div className="explore__card-avatar">
          {salon.name.charAt(0).toUpperCase()}
        </div>
        <div className="explore__card-info">
          <h3 className="explore__card-name">
            {salon.name}
            {promoted && <span className="explore__card-badge">&#9733;</span>}
          </h3>
          {salon.city && (
            <span className="explore__card-city">{salon.city}</span>
          )}
        </div>
      </div>

      {salon.description && (
        <p className="explore__card-desc">{salon.description}</p>
      )}

      <div className="explore__card-details">
        {salon.address && (
          <span className="explore__card-detail">
            <span className="explore__card-icon">&#128205;</span> {salon.address}
          </span>
        )}
        {salon.phone && (
          <span className="explore__card-detail">
            <span className="explore__card-icon">&#128222;</span> {salon.phone}
          </span>
        )}
        {salon.instagram && (
          <span className="explore__card-detail">
            <span className="explore__card-icon">&#128247;</span> @{salon.instagram.replace('@', '')}
          </span>
        )}
      </div>

      <div className="explore__card-action">
        {t('explore.bookNow')} &rarr;
      </div>
    </Link>
  )
}
