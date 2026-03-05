import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import './Toast.css'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext).toast
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
