import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { deriveKey } from '../lib/crypto'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cryptoKey, setCryptoKey] = useState(null)
  const [loading, setLoading] = useState(true)

  // Ripristina sessione esistente al mount
  // NOTA: la cryptoKey NON può essere ricreata da una sessione salvata,
  // perché serve la password in chiaro (mai persistita). Per questo, se
  // l'utente ricarica la pagina con una sessione attiva ma senza aver
  // rifatto login in questa "vita" del browser, cryptoKey resta null finché
  // non rifà login. È lo stesso comportamento che avevi con Appwrite.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) setCryptoKey(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // Se la conferma email è richiesta, potrebbe non esserci sessione subito
    if (data.session) {
      setUser(data.user)
      const key = await deriveKey(password, data.user.id)
      setCryptoKey(key)
    }
    return data.user
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user)
    const key = await deriveKey(password, data.user.id)
    setCryptoKey(key)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCryptoKey(null)
  }, [])

  // Invia email con link di recupero
  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${import.meta.env.VITE_BASE_PATH || '/'}reset-password`,
    })
    if (error) throw error
  }, [])

  // Chiamata nella pagina di destinazione del link email: a questo punto
  // Supabase ha già creato una sessione "recovery" temporanea, basta
  // impostare la nuova password. ATTENZIONE: questo cambia la cryptoKey
  // e rende illeggibili i dati cifrati con la password precedente (vedi
  // guida di migrazione, Passo 13).
  const confirmReset = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    const key = await deriveKey(newPassword, data.user.id)
    setCryptoKey(key)
    return data.user
  }, [])

  const isSuperAdmin = user?.email === import.meta.env.VITE_SUPERADMIN_EMAIL

  return (
    <AuthContext.Provider value={{
      user, cryptoKey, loading,
      signUp, signIn, signOut,
      resetPassword, confirmReset,
      isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
