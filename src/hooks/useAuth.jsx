import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { account, ID } from '../lib/appwrite'
import { deriveKey } from '../lib/crypto'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [cryptoKey, setCryptoKey] = useState(null)
  const [loading,   setLoading]   = useState(true)

  // Ripristina sessione esistente al mount
  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Registrazione — nessuna verifica email richiesta
  const signUp = useCallback(async (email, password) => {
    const u = await account.create(ID.unique(), email, password)
    // Login automatico subito dopo la registrazione
    await account.createEmailPasswordSession(email, password)
    const me = await account.get()
    setUser(me)
    const key = await deriveKey(password, me.$id)
    setCryptoKey(key)
    return me
  }, [])

  const signIn = useCallback(async (email, password) => {
    await account.createEmailPasswordSession(email, password)
    const me = await account.get()
    setUser(me)
    const key = await deriveKey(password, me.$id)
    setCryptoKey(key)
    return me
  }, [])

  const signOut = useCallback(async () => {
    await account.deleteSession('current').catch(() => {})
    setUser(null)
    setCryptoKey(null)
  }, [])

  const resetPassword = useCallback(async (email) => {
    await account.createRecovery(email, `${window.location.origin}/reset-password`)
  }, [])

  const confirmReset = useCallback(async (userId, secret, newPassword) => {
    await account.updateRecovery(userId, secret, newPassword)
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
