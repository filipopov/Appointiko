import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, lazy, Suspense } from 'react'
import { api } from './api'
import { ToastProvider } from './components/ui/Toast'
import PageLoader from './components/PageLoader'
import NavigationProgress from './components/NavigationProgress'
import LandingPage from './pages/LandingPage'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/owner/DashboardPage'))
const ServicesPage = lazy(() => import('./pages/owner/ServicesPage'))
const WorkingHoursPage = lazy(() => import('./pages/owner/WorkingHoursPage'))
const SettingsPage = lazy(() => import('./pages/owner/SettingsPage'))
const PlanPage = lazy(() => import('./pages/owner/PlanPage'))
const BookingPage = lazy(() => import('./pages/public/BookingPage'))
const ExplorePage = lazy(() => import('./pages/public/ExplorePage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))

export const AuthContext = createContext<{
  user: any
  setUser: (u: any) => void
  loading: boolean
}>({ user: null, setUser: () => {}, loading: true })

function defaultRouteFor(user: any): string {
  if (!user) return '/'
  if (user.admin && !user.salon) return '/admin'
  return '/dashboard'
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
        <NavigationProgress />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={
              user ? <Navigate to={defaultRouteFor(user)} /> : <LandingPage />
            } />

            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/booking/:slug" element={<BookingPage />} />
            <Route path="/b/:slug" element={<BookingPage />} />

            <Route path="/login" element={
              user ? <Navigate to={defaultRouteFor(user)} /> : <LoginPage />
            } />
            <Route path="/register" element={
              user ? <Navigate to={defaultRouteFor(user)} /> : <RegisterPage />
            } />

            <Route path="/dashboard" element={
              loading ? null : user
                ? (user.salon ? <DashboardPage /> : <Navigate to="/admin" />)
                : <Navigate to="/login" />
            } />
            <Route path="/dashboard/services" element={
              loading ? null : user
                ? (user.salon ? <ServicesPage /> : <Navigate to="/admin" />)
                : <Navigate to="/login" />
            } />
            <Route path="/dashboard/hours" element={
              loading ? null : user
                ? (user.salon ? <WorkingHoursPage /> : <Navigate to="/admin" />)
                : <Navigate to="/login" />
            } />
            <Route path="/dashboard/settings" element={
              loading ? null : user
                ? (user.salon ? <SettingsPage /> : <Navigate to="/admin" />)
                : <Navigate to="/login" />
            } />
            <Route path="/dashboard/plan" element={
              loading ? null : user
                ? (user.salon ? <PlanPage /> : <Navigate to="/admin" />)
                : <Navigate to="/login" />
            } />
            <Route path="/admin" element={
              loading ? null : user?.admin ? <AdminPage /> : <Navigate to={user ? "/dashboard" : "/login"} />
            } />

            <Route path="*" element={<Navigate to={user ? defaultRouteFor(user) : "/"} />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthContext.Provider>
  )
}

export default App
