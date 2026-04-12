import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import MobileMenu from '../../components/MobileMenu'
import Skeleton from '../../components/ui/Skeleton'
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

const DEFAULT_CENTER: [number, number] = [41.9981, 21.4254]
const DEFAULT_ZOOM = 13

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light'
}

function createMarkerSvg(promoted: boolean) {
  const color = promoted ? '%23d4a017' : '%23c0567a'
  const star = promoted ? `<path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 16.8l-5.8 3.1 1.1-6.5L2.6 8.8l6.5-.9z" fill="%23fff" opacity="0.9"/>` : ''
  const inner = promoted ? '' : `<circle cx="12" cy="11" r="3.5" fill="%23fff"/>`
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='46' viewBox='0 0 36 46'%3E%3Cdefs%3E%3Cfilter id='s'%3E%3CfeDropShadow dx='0' dy='2' stdDeviation='2' flood-opacity='0.3'/%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M18 44C18 44 32 26 32 16A14 14 0 004 16c0 10 14 28 14 28z' fill='${color}' filter='url(%23s)'/%3E${inner}${star}%3C/svg%3E`
}

export default function ExplorePage() {
  const { t } = useTranslation()
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('grid')
  const [cityFilter, setCityFilter] = useState('')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

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

  const updateTiles = useCallback(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return
    const isDark = getTheme() === 'dark'
    tileLayerRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES)
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => updateTiles())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [updateTiles])

  // Initialize map once, invalidate on view switch
  useEffect(() => {
    if (!mapRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, { attributionControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      const isDark = getTheme() === 'dark'
      tileLayerRef.current = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
      markersRef.current = L.layerGroup().addTo(mapInstanceRef.current)
    }

    if (view === 'map') {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50)
    }

    markersRef.current?.clearLayers()

    const salonsWithCoords = filtered.filter(s => s.latitude && s.longitude)

    salonsWithCoords.forEach(salon => {
      const icon = L.icon({
        iconUrl: createMarkerSvg(salon.promoted),
        iconSize: [36, 46],
        iconAnchor: [18, 44],
        popupAnchor: [0, -40],
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

    if (salonsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        salonsWithCoords.map(s => [s.latitude!, s.longitude!] as [number, number])
      )
      mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [view, filtered, t])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersRef.current = null
        tileLayerRef.current = null
      }
    }
  }, [])

  return (
    <div className="explore">
      <header className="explore__header">
        <Link to="/" className="explore__brand"><Logo size={28} /> Appointiko</Link>
        <div className="explore__header-right">
          <div className="desktop-only">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <Link to="/login" className="explore__login-link">{t('auth.login')}</Link>
          <MobileMenu />
        </div>
      </header>

      <section className="explore__hero">
        <h1 className="explore__title">{t('explore.title')}</h1>
        <p className="explore__subtitle">{t('explore.subtitle')}</p>
      </section>

      {!loading && (
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
      )}

      {/* Map is always mounted, hidden via CSS to preserve Leaflet state */}
      <div className="explore__map-container" style={{ display: !loading && view === 'map' ? 'block' : 'none' }}>
        <div ref={mapRef} className="explore__map" />
      </div>

      {loading ? (
        <div className="explore__skeleton">
          <Skeleton rows={6} height={100} />
        </div>
      ) : (
        <>
          {view === 'grid' && (
            <div className="explore__content">
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
