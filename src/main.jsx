import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'

// Registra il service worker; mostra un toast quando è disponibile un aggiornamento
const updateSW = registerSW({
  onNeedRefresh() {
    // Mostriamo un banner "Aggiorna" — gestito da UpdateBanner in App
    window.dispatchEvent(new CustomEvent('pwa-update-available'))
  },
  onOfflineReady() {
    console.log('Beauty Planner: modalità offline disponibile ✅')
  },
})

// Esponi globalmente per il banner aggiornamento
window.__swUpdate = updateSW

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
