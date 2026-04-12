import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext } from 'react'
import { api } from './api'
import { ToastProvider } from './components/ui/Toast'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/owner/DashboardPage'
import ServicesPage from './pages/owner/ServicesPage'
import WorkingHoursPage from './pages/owner/WorkingHoursPage'
import SettingsPage from './pages/owner/SettingsPage'
import BookingPage from './pages/public/BookingPage'
import ExplorePage from './pages/public/ExplorePage'

export const AuthContext = createContext<{
  user: any
  setUser: (u: any) => void
  loading: boolean
}>({ user: null, setUser: () => {}, loading: true })

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <ToastProvider>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" /> : <LandingPage />
          } />

          {/* Public pages */}
          <Route path="/explore" element={<ExplorePage />} />
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
      </ToastProvider>
    </AuthContext.Provider>
  )
}

export default App
