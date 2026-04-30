import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import Logo from '../../components/Logo'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useToast } from '../../components/ui/Toast'
import './AdminPage.css'

const TIER_PRICE_MKD: Record<string, number> = {
  STANDARD: 999,
  PREMIUM: 1999,
}

interface AdminSalon {
  id: number
  name: string
  slug: string
  city: string | null
  phone: string | null
  active: boolean
  promoted: boolean
  promotedUntil: string | null
  tier: string
  effectiveTier: string
  trialUsed: boolean
  trialStartedAt: string | null
  trialEndsAt: string | null
  paidUntil: string | null
  billingCycle: string | null
  paymentNote: string | null
  serviceCount: number
  createdAt: string
}

type Filter = 'all' | 'free' | 'paid' | 'trial' | 'overdue'

export default function AdminPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [salons, setSalons] = useState<AdminSalon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [activateModal, setActivateModal] = useState<AdminSalon | null>(null)
  const [activateTier, setActivateTier] = useState('STANDARD')
  const [activateCycle, setActivateCycle] = useState('MONTHLY')
  const [activateNote, setActivateNote] = useState('')

  const load = () => {
    setLoading(true)
    api.adminGetSalons().then(setSalons).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const nowIso = new Date().toISOString()
    let paid = 0
    let free = 0
    let trialing = 0
    let overdue = 0
    let mrr = 0
    for (const s of salons) {
      if (s.trialEndsAt && !s.trialUsed && s.trialEndsAt > nowIso) trialing++
      if (s.paidUntil && s.paidUntil < today && s.tier !== 'FREE') overdue++
      if (s.effectiveTier === 'FREE') {
        free++
      } else if (s.tier !== 'FREE' && s.paidUntil && s.paidUntil >= today) {
        paid++
        const price = TIER_PRICE_MKD[s.tier] || 0
        mrr += s.billingCycle === 'ANNUAL' ? Math.round(price * 0.8) : price
      }
    }
    return { total: salons.length, paid, free, trialing, overdue, mrr }
  }, [salons])

  const filtered = salons.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.slug.includes(search.toLowerCase())) {
      return false
    }
    const now = new Date().toISOString().split('T')[0]
    switch (filter) {
      case 'free': return s.effectiveTier === 'FREE'
      case 'paid': return s.effectiveTier !== 'FREE'
      case 'trial': return s.trialEndsAt && !s.trialUsed && s.trialEndsAt > new Date().toISOString()
      case 'overdue': return s.paidUntil && s.paidUntil < now && s.tier !== 'FREE'
      default: return true
    }
  })

  const handleActivate = async () => {
    if (!activateModal) return
    try {
      await api.adminActivate(activateModal.id, {
        tier: activateTier,
        billingCycle: activateCycle,
        paymentNote: activateNote,
      })
      setActivateModal(null)
      setActivateNote('')
      load()
      toast(t('admin.activate') + ' - ' + activateModal.name, 'success')
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    }
  }

  const handleDeactivate = async (salon: AdminSalon) => {
    if (!confirm(t('admin.confirmDeactivate'))) return
    try {
      await api.adminDeactivate(salon.id)
      load()
      toast(t('admin.deactivate') + ' - ' + salon.name, 'info')
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    }
  }

  const handleBoost = async (salon: AdminSalon, days: number) => {
    try {
      await api.adminBoost(salon.id, days)
      load()
      toast(t('admin.boost') + ` ${days}d - ` + salon.name, 'success')
    } catch {
      toast(t('errors.UNKNOWN'), 'error')
    }
  }

  const tierBadge = (tier: string) => {
    const cls = tier === 'PREMIUM' ? 'admin__tier--premium'
      : tier === 'STANDARD' ? 'admin__tier--standard'
      : 'admin__tier--free'
    return <span className={`admin__tier-badge ${cls}`}>{tier}</span>
  }

  const trialStatus = (s: AdminSalon) => {
    if (!s.trialStartedAt) return <span className="admin__muted">{t('admin.noTrial')}</span>
    if (s.trialUsed) return <span className="admin__muted">{t('admin.trialUsed')}</span>
    if (s.trialEndsAt && s.trialEndsAt > new Date().toISOString()) {
      const days = Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / 86400000)
      return <span className="admin__trial-active">{t('admin.active')} ({days}d)</span>
    }
    return <span className="admin__muted">{t('admin.expired')}</span>
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString()
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <Link to="/" className="admin__brand"><Logo size={28} /> Appointiko</Link>
        <h1 className="admin__title">{t('admin.title')}</h1>
        <Link to="/dashboard" className="admin__back">{t('nav.dashboard')}</Link>
      </header>

      <div className="admin__container">
        <div className="admin__stats">
          <div className="admin__stat">
            <div className="admin__stat-num">{stats.total}</div>
            <div className="admin__stat-label">{t('admin.statTotal')}</div>
          </div>
          <div className="admin__stat admin__stat--success">
            <div className="admin__stat-num">{stats.paid}</div>
            <div className="admin__stat-label">{t('admin.statPaid')}</div>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-num">{stats.trialing}</div>
            <div className="admin__stat-label">{t('admin.statTrialing')}</div>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-num">{stats.free}</div>
            <div className="admin__stat-label">{t('admin.statFree')}</div>
          </div>
          <div className={`admin__stat ${stats.overdue > 0 ? 'admin__stat--danger' : ''}`}>
            <div className="admin__stat-num">{stats.overdue}</div>
            <div className="admin__stat-label">{t('admin.statOverdue')}</div>
          </div>
          <div className="admin__stat admin__stat--primary">
            <div className="admin__stat-num">{stats.mrr.toLocaleString()}</div>
            <div className="admin__stat-label">{t('admin.statMrr')}</div>
          </div>
        </div>

        <div className="admin__controls">
          <input
            className="admin__search"
            type="text"
            placeholder={t('admin.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="admin__filters">
            {(['all', 'free', 'paid', 'trial', 'overdue'] as Filter[]).map(f => (
              <button
                key={f}
                className={`admin__filter-btn ${filter === f ? 'admin__filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {t(`admin.${f === 'free' ? 'freeTier' : f === 'trial' ? 'trialActive' : f}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin__count">{filtered.length} {t('admin.salons').toLowerCase()}</div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>{t('settings.name')}</th>
                  <th>{t('admin.tier')}</th>
                  <th>{t('admin.effectiveTier')}</th>
                  <th>{t('admin.trialStatus')}</th>
                  <th>{t('admin.paidUntil')}</th>
                  <th>{t('admin.services')}</th>
                  <th>{t('admin.created')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className={s.effectiveTier === 'FREE' && s.trialUsed ? 'admin__row--faded' : ''}>
                    <td>
                      <div className="admin__salon-name">
                        {s.name}
                        {s.promoted && <span className="admin__promoted-badge">&#9733;</span>}
                      </div>
                      <div className="admin__salon-meta">{s.city || '—'} &middot; {s.slug}</div>
                    </td>
                    <td>{tierBadge(s.tier)}</td>
                    <td>{tierBadge(s.effectiveTier)}</td>
                    <td>{trialStatus(s)}</td>
                    <td>
                      {s.paidUntil ? (
                        <span className={s.paidUntil < new Date().toISOString().split('T')[0] ? 'admin__overdue' : ''}>
                          {formatDate(s.paidUntil)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{s.serviceCount}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>
                      <div className="admin__action-group">
                        <Button size="sm" onClick={() => {
                          setActivateModal(s)
                          setActivateTier(s.tier === 'FREE' ? 'STANDARD' : s.tier)
                          setActivateCycle(s.billingCycle || 'MONTHLY')
                          setActivateNote(s.paymentNote || '')
                        }}>
                          {t('admin.activate')}
                        </Button>
                        {s.effectiveTier !== 'FREE' && (
                          <Button size="sm" variant="danger" onClick={() => handleDeactivate(s)}>
                            {t('admin.deactivate')}
                          </Button>
                        )}
                        <div className="admin__boost-btns">
                          <button className="admin__boost-btn" onClick={() => handleBoost(s, 7)}>{t('admin.boost7')}</button>
                          <button className="admin__boost-btn" onClick={() => handleBoost(s, 30)}>{t('admin.boost30')}</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activate modal */}
      {activateModal && (
        <div className="admin__modal-overlay" onClick={() => setActivateModal(null)}>
          <Card className="admin__modal" onClick={e => e.stopPropagation()}>
            <h3>{t('admin.activateTitle')}: {activateModal.name}</h3>
            <div className="admin__modal-form">
              <div className="admin__modal-field">
                <label>{t('admin.selectTier')}</label>
                <select value={activateTier} onChange={e => setActivateTier(e.target.value)}>
                  <option value="STANDARD">Standard (999 MKD)</option>
                  <option value="PREMIUM">Premium (1,999 MKD)</option>
                </select>
              </div>
              <div className="admin__modal-field">
                <label>{t('admin.billingCycle')}</label>
                <select value={activateCycle} onChange={e => setActivateCycle(e.target.value)}>
                  <option value="MONTHLY">{t('admin.monthly')}</option>
                  <option value="ANNUAL">{t('admin.annually')}</option>
                </select>
              </div>
              <div className="admin__modal-field">
                <label>{t('admin.paymentNote')}</label>
                <input
                  type="text"
                  value={activateNote}
                  onChange={e => setActivateNote(e.target.value)}
                  placeholder={t('admin.paymentNotePlaceholder')}
                />
              </div>
              <div className="admin__modal-actions">
                <Button onClick={handleActivate}>{t('admin.confirmActivate')}</Button>
                <Button variant="secondary" onClick={() => setActivateModal(null)}>{t('dashboard.goBack')}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
