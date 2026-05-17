import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

/**
 * Hook that tracks online/offline status.
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

/**
 * Sticky banner shown when the device goes offline.
 * Fades in / out without jumping the layout.
 */
export function OfflineBanner() {
  const online   = useNetworkStatus()
  const [show, setShow] = useState(false)
  const [prev,  setPrev] = useState(true) // start as online to avoid flicker on mount

  useEffect(() => {
    if (!online) {
      // went offline → show immediately
      setShow(true)
    } else if (!prev) {
      // came back online → brief "Connessa!" then hide
      setShow(true)
      const t = setTimeout(() => setShow(false), 2200)
      return () => clearTimeout(t)
    }
    setPrev(online)
  }, [online])

  if (!show) return null

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 text-white text-xs font-medium shadow-md animate-slide-up"
      style={{
        background: online ? 'var(--c-success)' : '#374151',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
      }}
    >
      {online ? (
        <>✅ Connessione ripristinata</>
      ) : (
        <><WifiOff size={13} /> Modalità offline — i dati locali sono disponibili</>
      )}
    </div>
  )
}
