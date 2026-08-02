import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { applyTheme, resolveMode, DEFAULT_PALETTE } from '../styles/themes'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const STORAGE_KEY_PALETTE = 'bp_palette'
const STORAGE_KEY_MODE    = 'bp_mode'

const ThemeContext = createContext(null)

// Il Provider va montato UNA VOLTA SOLA, in cima all'app (App.jsx), così
// l'effetto che applica i colori scatta subito all'avvio e non solo quando
// si visita la pagina Impostazioni.
export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [palette,    setPalette]    = useState(() => localStorage.getItem(STORAGE_KEY_PALETTE) || DEFAULT_PALETTE)
  const [preference, setPreference] = useState(() => localStorage.getItem(STORAGE_KEY_MODE)    || 'system')

  const apply = useCallback((pal, pref) => {
    const mode = resolveMode(pref)
    applyTheme(pal, mode)
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Al login, se l'account ha una preferenza salvata (user_metadata),
  // ha priorità sul valore locale — così sopravvive anche se iOS ha
  // svuotato il localStorage della PWA nel frattempo.
  useEffect(() => {
    if (!user) return
    const saved = user.user_metadata || {}
    if (saved.palette || saved.theme_mode) {
      const pal  = saved.palette    || palette
      const pref = saved.theme_mode || preference
      setPalette(pal)
      setPreference(pref)
      localStorage.setItem(STORAGE_KEY_PALETTE, pal)
      localStorage.setItem(STORAGE_KEY_MODE, pref)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Applica subito al mount e ad ogni cambio
  useEffect(() => {
    apply(palette, preference)
  }, [palette, preference, apply])

  // Reagisce ai cambi di tema di sistema
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => apply(palette, 'system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference, palette, apply])

  const syncToAccount = useCallback((pal, pref) => {
    if (!user) return
    supabase.auth.updateUser({ data: { palette: pal, theme_mode: pref } })
      .catch(err => console.warn('[useTheme] sync account failed', err))
  }, [user])

  const changePalette = useCallback((pal) => {
    setPalette(pal)
    localStorage.setItem(STORAGE_KEY_PALETTE, pal)
    syncToAccount(pal, preference)
  }, [preference, syncToAccount])

  const changeMode = useCallback((pref) => {
    setPreference(pref)
    localStorage.setItem(STORAGE_KEY_MODE, pref)
    syncToAccount(palette, pref)
  }, [palette, syncToAccount])

  return (
    <ThemeContext.Provider value={{ palette, preference, changePalette, changeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Stessa API di prima (palette, preference, changePalette, changeMode) —
// SettingsView.jsx non deve cambiare nulla, continua a chiamare useTheme()
// esattamente come faceva già.
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve essere usato dentro <ThemeProvider>')
  return ctx
}
