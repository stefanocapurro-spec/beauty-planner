import { useState, useEffect, useCallback } from 'react'
import { applyTheme, resolveMode, DEFAULT_PALETTE } from '../styles/themes'

const STORAGE_KEY_PALETTE = 'bp_palette'
const STORAGE_KEY_MODE    = 'bp_mode'

export function useTheme() {
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

  // Apply on mount and whenever palette / preference changes
  useEffect(() => {
    apply(palette, preference)
  }, [palette, preference, apply])

  // React to system theme changes
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => apply(palette, 'system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference, palette, apply])

  const changePalette = useCallback((pal) => {
    setPalette(pal)
    localStorage.setItem(STORAGE_KEY_PALETTE, pal)
  }, [])

  const changeMode = useCallback((pref) => {
    setPreference(pref)
    localStorage.setItem(STORAGE_KEY_MODE, pref)
  }, [])

  return { palette, preference, changePalette, changeMode }
}
