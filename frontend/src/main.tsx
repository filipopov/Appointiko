import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Unregister any previously installed service worker (push notifications removed)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()))
    .catch(() => {})
}
