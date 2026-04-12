import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './NavigationProgress.css'

export default function NavigationProgress() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  if (!visible) return null

  return <div className="nav-progress"><div className="nav-progress__bar" /></div>
}
