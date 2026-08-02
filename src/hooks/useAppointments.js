import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import { encryptRecord, decryptRecords, decryptRecord } from '../lib/crypto'
import { useAuth } from './useAuth'

export function useAppointments() {
  const { user, cryptoKey } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(TABLES.APPOINTMENTS)
        .select('*')
        .order('appointment_date', { ascending: true })
        .limit(500)
      if (error) throw error
      const decrypted = await decryptRecords(data, cryptoKey)
      setAppointments(decrypted)
    } catch (e) {
      console.error('[useAppointments] load:', e)
    } finally {
      setLoading(false)
    }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (appt) => {
    const record = await encryptRecord({
      ...appt,
      user_id: user.id,
      payment_status: appt.payment_status || 'pending',
      service_price: appt.service_price != null ? String(appt.service_price) : null,
      advance_amount: appt.advance_amount != null ? String(appt.advance_amount) : null,
    }, cryptoKey)
    const { data, error } = await supabase.from(TABLES.APPOINTMENTS).insert(record).select().single()
    if (error) throw error
    const plain = await decryptRecord(data, cryptoKey)
    setAppointments(prev =>
      [...prev, plain].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
    )
    return plain
  }, [user, cryptoKey])

  const update = useCallback(async (id, changes) => {
    const record = await encryptRecord({
      ...changes,
      service_price: changes.service_price != null ? String(changes.service_price) : null,
      advance_amount: changes.advance_amount != null ? String(changes.advance_amount) : null,
    }, cryptoKey)
    const { data, error } = await supabase.from(TABLES.APPOINTMENTS).update(record).eq('id', id).select().single()
    if (error) throw error
    const plain = await decryptRecord(data, cryptoKey)
    setAppointments(prev => prev.map(a => a.id === id ? plain : a))
    return plain
  }, [cryptoKey])

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from(TABLES.APPOINTMENTS).delete().eq('id', id)
    if (error) throw error
    setAppointments(prev => prev.filter(a => a.id !== id))
  }, [])

  return { appointments, loading, add, update, remove, reload: load }
}
