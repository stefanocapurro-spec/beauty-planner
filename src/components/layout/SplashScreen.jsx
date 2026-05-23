import { useEffect, useState } from 'react'

/**
 * Animated splash screen shown for ~700 ms while the app boots.
 * Fades out smoothly once `ready` becomes true.
 */
export function SplashScreen({ ready }) {
  const [visible, setVisible] = useState(true)
  const [fading,  setFading]  = useState(false)

  useEffect(() => {
    if (!ready) return
    // Start fade-out after a minimum display time
    const t1 = setTimeout(() => setFading(true),   300)
    const t2 = setTimeout(() => setVisible(false),  750)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [ready])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 transition-opacity duration-500"
      style={{
        background:     'var(--c-bg)',
        opacity:        fading ? 0 : 1,
        pointerEvents:  fading ? 'none' : 'auto',
      }}
    >
      {/* Animated logo */}
      <div className="relative">
        <span
          className="absolute inset-0 rounded-[1.8rem] animate-ping opacity-20"
          style={{ background: 'var(--c-primary)' }}
        />
        <div className="relative w-24 h-24 rounded-[1.8rem] overflow-hidden shadow-2xl">
          <img src="/icons/icon-192.png" alt="Beauty Planner" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-body tracking-tight">
          Beauty Planner
        </h1>
        <p className="text-muted text-sm mt-1">Il tuo assistente personale</p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              background:     'var(--c-accent)',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      <p className="text-faint text-xs absolute bottom-8">🔒 Dati cifrati end-to-end</p>
    </div>
  )
}
