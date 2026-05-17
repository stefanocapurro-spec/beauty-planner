import { useState, useEffect, useCallback } from 'react'
import { databases, DB_ID, COL, ID, Query, ownerPerms } from '../lib/appwrite'
import { encrypt, decrypt } from '../lib/crypto'
import { DEFAULT_SERVICES } from '../data/services'
import { useAuth } from './useAuth'

async function decryptService(doc, cryptoKey) {
  return {
    id:       doc.$id,
    icon:     doc.icon,
    category: doc.category,
    name:     await decrypt(doc.name,  cryptoKey),
    price:    await decrypt(doc.price, cryptoKey),
  }
}

export function useServices() {
  const { user, cryptoKey } = useAuth()
  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COL.SERVICES, [
        Query.equal('user_id', user.$id),
        Query.limit(100),
      ])
      if (res.total === 0) { await seedDefaults(); return }
      const decrypted = await Promise.all(res.documents.map(d => decryptService(d, cryptoKey)))
      setServices(decrypted)
    } finally { setLoading(false) }
  }, [user, cryptoKey])

  async function seedDefaults() {
    await Promise.all(DEFAULT_SERVICES.map(async s => {
      await databases.createDocument(DB_ID, COL.SERVICES, s.id, {
        user_id:  user.$id,
        icon:     s.icon,
        category: s.category,
        name:     await encrypt(s.name,  cryptoKey),
        price:    await encrypt(s.price, cryptoKey),
      }, ownerPerms(user.$id))
    }))
    await load()
  }

  useEffect(() => { load() }, [load])

  const addService = useCallback(async ({ icon, category, name, price }) => {
    const doc = await databases.createDocument(DB_ID, COL.SERVICES, ID.unique(), {
      user_id:  user.$id,
      icon, category,
      name:  await encrypt(name,  cryptoKey),
      price: await encrypt(price, cryptoKey),
    }, ownerPerms(user.$id))
    const plain = { id: doc.$id, icon, category, name, price }
    setServices(prev => [...prev, plain])
    return plain
  }, [user, cryptoKey])

  const updateService = useCallback(async (id, { icon, category, name, price }) => {
    await databases.updateDocument(DB_ID, COL.SERVICES, id, {
      icon, category,
      name:  await encrypt(name,  cryptoKey),
      price: await encrypt(price, cryptoKey),
    })
    setServices(prev => prev.map(s => s.id === id ? { ...s, icon, category, name, price } : s))
  }, [cryptoKey])

  const deleteService = useCallback(async (id) => {
    await databases.deleteDocument(DB_ID, COL.SERVICES, id)
    setServices(prev => prev.filter(s => s.id !== id))
  }, [])

  return { services, loading, addService, updateService, deleteService, reload: load }
}
