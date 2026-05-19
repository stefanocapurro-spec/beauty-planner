import { useState, useEffect, useCallback, useRef } from 'react'
import { databases, DB_ID, COL, ID, Query, ownerPerms } from '../lib/appwrite'
import { encrypt, decrypt } from '../lib/crypto'
import { DEFAULT_SERVICES } from '../data/services'
import { useAuth } from './useAuth'

async function decryptService(doc, cryptoKey) {
  try {
    return {
      id:       doc.$id,
      icon:     doc.icon,
      category: doc.category,
      name:     await decrypt(doc.name,  cryptoKey),
      price:    Number(await decrypt(doc.price, cryptoKey)),
    }
  } catch {
    return { id: doc.$id, icon: doc.icon, category: doc.category, name: '(errore)', price: 0 }
  }
}

const byCategory = (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)

export function useServices() {
  const { user, cryptoKey } = useAuth()
  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const seeded = useRef(false)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COL.SERVICES, [
        Query.equal('user_id', user.$id),
        Query.limit(200),
      ])

      if (res.total === 0 && !seeded.current) {
        seeded.current = true
        // Inserisci i default uno alla volta (ignora conflitti)
        for (const s of DEFAULT_SERVICES) {
          try {
            await databases.createDocument(DB_ID, COL.SERVICES, s.id, {
              user_id:  user.$id,
              icon:     s.icon,
              category: s.category,
              name:     await encrypt(s.name,  cryptoKey),
              price:    await encrypt(String(s.price), cryptoKey),
            }, ownerPerms(user.$id))
          } catch (e) {
            if (e.code !== 409) console.warn('Seed skip:', s.name, e.message)
          }
        }
        // Rileggi dopo il seed
        const res2 = await databases.listDocuments(DB_ID, COL.SERVICES, [
          Query.equal('user_id', user.$id),
          Query.limit(200),
        ])
        const plain = await Promise.all(res2.documents.map(d => decryptService(d, cryptoKey)))
        setServices(plain.sort(byCategory))
        return
      }

      const plain = await Promise.all(res.documents.map(d => decryptService(d, cryptoKey)))
      setServices(plain.sort(byCategory))
    } catch (e) {
      console.error('[useServices] load:', e)
    } finally {
      setLoading(false)
    }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  const addService = useCallback(async ({ icon, category, name, price }) => {
    const doc = await databases.createDocument(DB_ID, COL.SERVICES, ID.unique(), {
      user_id:  user.$id,
      icon,
      category,
      name:  await encrypt(name, cryptoKey),
      price: await encrypt(String(Number(price)), cryptoKey),
    }, ownerPerms(user.$id))
    const plain = { id: doc.$id, icon, category, name, price: Number(price) }
    setServices(prev => [...prev, plain].sort(byCategory))
    return plain
  }, [user, cryptoKey])

  const updateService = useCallback(async (id, { icon, category, name, price }) => {
    await databases.updateDocument(DB_ID, COL.SERVICES, id, {
      icon,
      category,
      name:  await encrypt(name, cryptoKey),
      price: await encrypt(String(Number(price)), cryptoKey),
    })
    setServices(prev =>
      prev.map(s => s.id === id ? { ...s, icon, category, name, price: Number(price) } : s)
          .sort(byCategory)
    )
  }, [cryptoKey])

  const deleteService = useCallback(async (id) => {
    await databases.deleteDocument(DB_ID, COL.SERVICES, id)
    setServices(prev => prev.filter(s => s.id !== id))
  }, [])

  return { services, loading, addService, updateService, deleteService, reload: load }
}
