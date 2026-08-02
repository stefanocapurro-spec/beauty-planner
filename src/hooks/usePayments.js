import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import { encryptRecord, decryptRecords } from '../lib/crypto'
import { useAuth } from './useAuth'

// ── Hook per singolo appuntamento ─────────────────────────────────────────
export function usePayments(appointmentId) {
  const { user, cryptoKey } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user || !cryptoKey || !appointmentId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true })
      if (error) throw error
      const plain = await decryptRecords(data, cryptoKey)
      setPayments(plain)
    } finally {
      setLoading(false)
    }
  }, [user, cryptoKey, appointmentId])

  useEffect(() => { load() }, [load])

  const removePayment = useCallback(async (id) => {
    const { error } = await supabase.from(TABLES.PAYMENTS).delete().eq('id', id)
    if (error) throw error
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  return { payments, loading, reload: load, removePayment }
}

// ── Funzione standalone per registrare un pagamento ──────────────────────
export async function createPaymentRecord({ user, cryptoKey, appointment, type, amount, notes = '' }) {
  const record = await encryptRecord({
    user_id: user.id,
    appointment_id: appointment.id,
    type, // 'paid' | 'deferred' | 'advance' | 'cancelled'
    appointment_date: appointment.appointment_date || '',
    amount: String(amount || 0),
    notes,
    client_name: appointment.client_name || '',
    service_name: appointment.service_name || '',
  }, cryptoKey)
  const { data, error } = await supabase.from(TABLES.PAYMENTS).insert(record).select().single()
  if (error) throw error
  return data
}

// ── Hook globale: tutti i pagamenti dell'utente ───────────────────────────
export function useAllPayments() {
  const { user, cryptoKey } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      const plain = await decryptRecords(data, cryptoKey)
      setPayments(plain)
    } catch (e) {
      console.error('[useAllPayments]', e)
    } finally {
      setLoading(false)
    }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  return { payments, loading, reload: load }
}
