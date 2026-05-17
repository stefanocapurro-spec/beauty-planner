import { useState, useEffect, useCallback } from 'react'
import { databases, DB_ID, COL, ID, Query, ownerPerms } from '../lib/appwrite'
import { encrypt, decrypt } from '../lib/crypto'
import { useAuth } from './useAuth'

// Campi cifrati nel documento pagamento
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
      const decrypted = await Promise.all(res.documents.map(d => decryptPayment(d, cryptoKey)))
      setPayments(decrypted)
    } finally { setLoading(false) }
  }, [user, cryptoKey, appointmentId])

  useEffect(() => { load() }, [load])

  // ── Registra un pagamento ─────────────────────────────────────────────
  // clientName e serviceName vengono denormalizzati sul documento
  // per evitare join in PaymentsView
  const recordPayment = useCallback(async ({
    appointment_id, type, amount, notes,
    client_name = '', service_name = '', appointment_date = '',
  }) => {
    const doc = await databases.createDocument(DB_ID, COL.PAYMENTS, ID.unique(), {
      user_id:          user.$id,
      appointment_id,
      type,
      appointment_date,
      amount:       await encrypt(amount,       cryptoKey),
      notes:        await encrypt(notes || '',  cryptoKey),
      client_name:  await encrypt(client_name,  cryptoKey),
      service_name: await encrypt(service_name, cryptoKey),
    }, ownerPerms(user.$id))
    const plain = await decryptPayment(doc, cryptoKey)
    setPayments(prev => [...prev, plain])
    return plain
  }, [user, cryptoKey])

  const removePayment = useCallback(async (id) => {
    await databases.deleteDocument(DB_ID, COL.PAYMENTS, id)
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  return { payments, loading, recordPayment, removePayment, reload: load }
}

// ── Hook standalone: tutti i pagamenti dell'utente (per PaymentsView) ────
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
      const decrypted = await Promise.all(res.documents.map(d => decryptPayment(d, cryptoKey)))
      setPayments(decrypted)
    } finally { setLoading(false) }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  return { payments, loading, reload: load }
}
