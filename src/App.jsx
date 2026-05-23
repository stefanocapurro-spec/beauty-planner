import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './components/auth/AuthPage'
import { AppointmentsView } from './components/appointments/AppointmentsView'
import { ServicesView } from './components/services/ServicesView'
import { PaymentsView } from './components/payments/PaymentsView'
import { SettingsView } from './components/settings/SettingsView'
import { SuperAdminPanel } from './components/admin/SuperAdminPanel'
import { BottomNav } from './components/layout/BottomNav'
import { OfflineBanner } from './components/layout/OfflineBanner'
import { SplashScreen } from './components/layout/SplashScreen'
import { APP_NAME, APP_ICON } from './lib/constants'
import { RefreshCw, Download, X } from 'lucide-react'

// ── Banner aggiornamento SW ───────────────────────────────────────────────
function UpdateBanner() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const h = () => setVisible(true)
    window.addEventListener('pwa-update-available', h)
    return () => window.removeEventListener('pwa-update-available', h)
  }, [])
  if (!visible) return null
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-white text-sm shadow-md animate-slide-in flex-shrink-0"
         style={{ background: 'var(--c-primary)' }}>
      <span className="flex items-center gap-2"><RefreshCw size={14} /> Nuova versione disponibile</span>
      <div className="flex gap-3">
        <button onClick={() => window.__swUpdate?.(true)} className="font-semibold underline text-xs">Aggiorna</button>
        <button onClick={() => setVisible(false)} aria-label="Ignora"><X size={14} /></button>
      </div>
    </div>
  )
}

// ── Banner installazione PWA (Android/Chrome) ─────────────────────────────
function InstallBanner() {
  const [prompt,  setPrompt]  = useState(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const h = e => { e.preventDefault(); setPrompt(e); setVisible(true) }
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('appinstalled', () => setVisible(false))
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
  }
  if (!visible) return null
  return (
    <div className="absolute bottom-20 left-3 right-3 z-40 card shadow-2xl animate-slide-up flex items-center gap-3 p-3"
         style={{ border: '1.5px solid var(--c-primary)' }}>
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
        <img src={APP_ICON} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-body">Installa l'app</p>
        <p className="text-xs text-faint leading-tight">Accedi dalla schermata home, funziona offline</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button onClick={() => setVisible(false)} className="p-1.5 rounded-lg text-faint hover:text-muted hover:bg-surface-2 transition-colors" aria-label="Chiudi"><X size={15} /></button>
        <button onClick={install} className="btn-primary rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1">
          <Download size={13} /> Installa
        </button>
      </div>
    </div>
  )
}

// ── Chiave crittografica mancante ─────────────────────────────────────────
function NoCryptoKey() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center gap-4">
      <span className="text-5xl">🔑</span>
      <h2 className="font-display text-xl font-semibold text-body">Sessione scaduta</h2>
      <p className="text-muted text-sm max-w-xs">La chiave di cifratura esiste solo in memoria RAM. Accedi di nuovo per ricrearla.</p>
      <button onClick={signOut} className="btn-primary rounded-xl px-6 py-2.5 text-sm font-medium mt-2">Torna al login</button>
    </div>
  )
}

// ── App principale ────────────────────────────────────────────────────────
export default function App() {
  const { user, cryptoKey, loading } = useAuth()
  const [tab,       setTab]       = useState('appointments')
  const [adminOpen, setAdminOpen] = useState(false)

  if (!loading && !user) return (
    <>
      <SplashScreen ready />
      <AuthPage />
    </>
  )

  if (loading) return <SplashScreen ready={false} />
  if (!cryptoKey) return <NoCryptoKey />

  return (
    <div className="flex flex-col bg-app overflow-hidden relative"
         style={{ height: '100dvh', maxWidth: '448px', margin: '0 auto',
                  paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <OfflineBanner />
      <UpdateBanner />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-surface border-b border-theme flex-shrink-0">
        <img src={APP_ICON} alt={APP_NAME} className="w-9 h-9 rounded-xl shadow-sm object-cover" />
        <h1 className="font-display font-semibold text-body text-base">{APP_NAME}</h1>
        <div className="ml-auto">
          <span className="text-xs text-faint select-none">🔒 cifrato</span>
        </div>
      </header>

      {/* Vista corrente */}
      <main className="flex-1 overflow-hidden px-4 pt-4">
        {tab === 'appointments' && <AppointmentsView />}
        {tab === 'services'     && <ServicesView />}
        {tab === 'payments'     && <PaymentsView />}
        {tab === 'settings'     && <SettingsView onSuperAdmin={() => setAdminOpen(true)} />}
      </main>

      <BottomNav current={tab} onChange={setTab} />
      <InstallBanner />
      {adminOpen && <SuperAdminPanel onClose={() => setAdminOpen(false)} />}

      <Toaster position="top-center"
        containerStyle={{ top: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}
        toastOptions={{
          style: { background: 'var(--c-surface)', color: 'var(--c-text)',
                   border: '1px solid var(--c-border)', borderRadius: '0.75rem', fontSize: '0.875rem' },
          duration: 3000,
        }} />
    </div>
  )
}
