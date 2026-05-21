import { useState, useEffect, useCallback } from 'react'
import { databases, DB_ID, COL, ID, Query, ownerPerms } from '../lib/appwrite'
import { encrypt, decrypt } from '../lib/crypto'
import { useAuth } from './useAuth'

const ENC_FIELDS = ['amount', 'notes', 'client_name', 'service_name']

async function decryptPayment(doc, cryptoKey) {
  const out = { ...doc, id: doc.$id }
  for (const f of ENC_FIELDS) {
    if (f in doc && typeof doc[f] === 'string') {
      try { out[f] = await decrypt(doc[f], cryptoKey) }
      catch { out[f] = doc[f] }
    }
  }
  return out
}

// ── Hook per singolo appuntamento ─────────────────────────────────────────
export function usePayments(appointmentId) {
  const { user, cryptoKey } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async () => {
    if (!user || !cryptoKey || !appointmentId) return
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COL.PAYMENTS, [
        Query.equal('appointment_id', appointmentId),
        Query.equal('user_id', user.$id),
        Query.orderAsc('$createdAt'),
      ])
      const plain = await Promise.all(res.documents.map(d => decryptPayment(d, cryptoKey)))
      setPayments(plain)
    } finally { setLoading(false) }
  }, [user, cryptoKey, appointmentId])

  useEffect(() => { load() }, [load])

  const removePayment = useCallback(async (id) => {
    await databases.deleteDocument(DB_ID, COL.PAYMENTS, id)
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  return { payments, loading, reload: load, removePayment }
}

// ── Funzione standalone per registrare un pagamento ──────────────────────
// Usata da AppointmentsView ogni volta che lo stato pagamento cambia
export async function createPaymentRecord({ user, cryptoKey, appointment, type, amount, notes = '' }) {
  const doc = await databases.createDocument(DB_ID, COL.PAYMENTS, ID.unique(), {
    user_id:          user.$id,
    appointment_id:   appointment.id,
    type,                                                    // 'paid' | 'deferred' | 'advance' | 'cancelled'
    appointment_date: appointment.appointment_date || '',
    amount:       await encrypt(String(amount || 0),              cryptoKey),
    notes:        await encrypt(notes,                            cryptoKey),
    client_name:  await encrypt(appointment.client_name  || '',   cryptoKey),
    service_name: await encrypt(appointment.service_name || '',   cryptoKey),
  }, ownerPerms(user.$id))
  return doc
}

// ── Hook globale: tutti i pagamenti dell'utente (per PaymentsView) ────────
export function useAllPayments() {
  const { user, cryptoKey } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COL.PAYMENTS, [
        Query.equal('user_id', user.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(500),
      ])
      const plain = await Promise.all(res.documents.map(d => decryptPayment(d, cryptoKey)))
      setPayments(plain)
    } catch (e) {
      console.error('[useAllPayments]', e)
    } finally { setLoading(false) }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  return { payments, loading, reload: load }
}
