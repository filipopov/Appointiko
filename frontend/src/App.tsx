import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, lazy, Suspense } from 'react'
import { api } from './api'
import { ToastProvider } from './components/ui/Toast'
import LandingPage from './pages/LandingPage'

// Lazy-load everything except the landing page (first paint)
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/owner/DashboardPage'))
const ServicesPage = lazy(() => import('./pages/owner/ServicesPage'))
const WorkingHoursPage = lazy(() => import('./pages/owner/WorkingHoursPage'))
const SettingsPage = lazy(() => import('./pages/owner/SettingsPage'))
const BookingPage = lazy(() => import('./pages/public/BookingPage'))
const ExplorePage = lazy(() => import('./pages/public/ExplorePage'))

export const AuthContext = createContext<{
  user: any
  setUser: (u: any) => void
  loading: boolean
}>({ user: null, setUser: () => {}, loading: true })

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }} />
    </div>
  )
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing page — eager loaded for instant first paint */}
            <Route path="/" element={
              user ? <Navigate to="/dashboard" /> : <LandingPage />
            } />

            {/* Public pages */}
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/booking/:slug" element={<BookingPage />} />
            <Route path="/b/:slug" element={<BookingPage />} />

            {/* Auth pages */}
            <Route path="/login" element={
              user ? <Navigate to="/dashboard" /> : <LoginPage />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/dashboard" /> : <RegisterPage />
            } />

            {/* Owner pages */}
            <Route path="/dashboard" element={
              loading ? null : user ? <DashboardPage /> : <Navigate to="/login" />
            } />
            <Route path="/dashboard/services" element={
              loading ? null : user ? <ServicesPage /> : <Navigate to="/login" />
            } />
            <Route path="/dashboard/hours" element={
              loading ? null : user ? <WorkingHoursPage /> : <Navigate to="/login" />
            } />
            <Route path="/dashboard/settings" element={
              loading ? null : user ? <SettingsPage /> : <Navigate to="/login" />
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthContext.Provider>
  )
}

export default App
