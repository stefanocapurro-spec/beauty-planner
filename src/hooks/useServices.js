import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import { encryptRecord, decryptRecords } from '../lib/crypto'
import { DEFAULT_SERVICES } from '../data/services'
import { useAuth } from './useAuth'

const byCategory = (a, b) =>
  a.category.localeCompare(b.category) || a.name.localeCompare(b.name)

export function useServices() {
  const { user, cryptoKey } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const seeded = useRef(false)

  const load = useCallback(async () => {
    if (!user || !cryptoKey) return
    setLoading(true)
    try {
      // RLS filtra già per user_id, non serve più il .eq('user_id', ...)
      const { data, error } = await supabase
        .from(TABLES.SERVICES)
        .select('*')
        .limit(200)
      if (error) throw error

      if (data.length === 0 && !seeded.current) {
        seeded.current = true
        for (const s of DEFAULT_SERVICES) {
          const record = await encryptRecord(
            { user_id: user.id, icon: s.icon, category: s.category, name: s.name, price: String(s.price) },
            cryptoKey
          )
          const { error: insErr } = await supabase.from(TABLES.SERVICES).insert(record)
          if (insErr) console.warn('Seed skip:', s.name, insErr.message)
        }
        const { data: data2, error: err2 } = await supabase.from(TABLES.SERVICES).select('*').limit(200)
        if (err2) throw err2
        const plain = await decryptRecords(data2, cryptoKey)
        setServices(plain.map(p => ({ ...p, price: Number(p.price) })).sort(byCategory))
        return
      }

      const plain = await decryptRecords(data, cryptoKey)
      setServices(plain.map(p => ({ ...p, price: Number(p.price) })).sort(byCategory))
    } catch (e) {
      console.error('[useServices] load:', e)
    } finally {
      setLoading(false)
    }
  }, [user, cryptoKey])

  useEffect(() => { load() }, [load])

  const addService = useCallback(async ({ icon, category, name, price }) => {
    const record = await encryptRecord(
      { user_id: user.id, icon, category, name, price: String(Number(price)) },
      cryptoKey
    )
    const { data, error } = await supabase.from(TABLES.SERVICES).insert(record).select().single()
    if (error) throw error
    const plain = { id: data.id, icon, category, name, price: Number(price) }
    setServices(prev => [...prev, plain].sort(byCategory))
    return plain
  }, [user, cryptoKey])

  const updateService = useCallback(async (id, { icon, category, name, price }) => {
    const record = await encryptRecord({ icon, category, name, price: String(Number(price)) }, cryptoKey)
    const { error } = await supabase.from(TABLES.SERVICES).update(record).eq('id', id)
    if (error) throw error
    setServices(prev =>
      prev.map(s => s.id === id ? { ...s, icon, category, name, price: Number(price) } : s).sort(byCategory)
    )
  }, [cryptoKey])

  const deleteService = useCallback(async (id) => {
    const { error } = await supabase.from(TABLES.SERVICES).delete().eq('id', id)
    if (error) throw error
    setServices(prev => prev.filter(s => s.id !== id))
  }, [])

  return { services, loading, addService, updateService, deleteService, reload: load }
}
