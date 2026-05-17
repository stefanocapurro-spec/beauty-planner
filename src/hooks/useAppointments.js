import { useState, useEffect, useCallback } from 'react'
import { databases, DB_ID, COL, ID, Query, ownerPerms } from '../lib/appwrite'
import { encrypt, decrypt } from '../lib/crypto'
import { useAuth } from './useAuth'

const ENC_FIELDS = ['client_name', 'client_phone', 'service_name', 'notes']

async function encryptAppt(data, cryptoKey) {
  const out = { ...data }
  for (const f of ENC_FIELDS) {
    if (f in data && data[f] != null)
      out[f] = await encrypt(data[f], cryptoKey)
  }
  return out
}

async function decryptAppt(doc, cryptoKey) {
  const out = { ...doc, id: doc.$id }
  for (const f of ENC_FIELDS) {
    if (f in doc && typeof doc[f] === 'string') {
      try { out[f] = await decrypt(doc[f], cryptoKey) }
      catch { out[f] = doc[f] }
    }
  }
  return out
}

export function useAppointments() {
  const { user, cryptoKey } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COL.APPOINTMENTS, [
        Query.equal('user_id', user.$id),
        Query.orderAsc('appointment_date'),
        Query.limit(500),
      ])
      const decrypted = await Promise.all(res.documents.map(d => decryptAppt(d, cryptoKey)))
      setAppointments(decrypted)
    } finally { setLoading(false) }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (appt) => {
    const payload = await encryptAppt({
      ...appt,
      user_id:        user.$id,
      payment_status: appt.payment_status || 'pending',
      service_price:  appt.service_price != null ? String(appt.service_price) : null,
      advance_amount: appt.advance_amount != null ? String(appt.advance_amount) : null,
    }, cryptoKey)
    const doc = await databases.createDocument(
      DB_ID, COL.APPOINTMENTS, ID.unique(), payload, ownerPerms(user.$id)
    )
    const plain = await decryptAppt(doc, cryptoKey)
    setAppointments(prev =>
      [...prev, plain].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
    )
    return plain
  }, [user, cryptoKey])

  const update = useCallback(async (id, changes) => {
    const payload = await encryptAppt({
      ...changes,
      service_price:  changes.service_price  != null ? String(changes.service_price)  : null,
      advance_amount: changes.advance_amount != null ? String(changes.advance_amount) : null,
    }, cryptoKey)
    const doc = await databases.updateDocument(DB_ID, COL.APPOINTMENTS, id, payload)
    const plain = await decryptAppt(doc, cryptoKey)
    setAppointments(prev => prev.map(a => a.id === id ? plain : a))
    return plain
  }, [cryptoKey])

  const remove = useCallback(async (id) => {
    await databases.deleteDocument(DB_ID, COL.APPOINTMENTS, id)
    setAppointments(prev => prev.filter(a => a.id !== id))
  }, [])

  return { appointments, loading, add, update, remove, reload: load }
}
