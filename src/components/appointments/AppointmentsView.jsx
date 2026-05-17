import { useState, useMemo } from 'react'
import { Plus, Search, Calendar, ChevronDown } from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAppointments } from '../../hooks/useAppointments'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentModal } from './AppointmentModal'
import { sendWhatsAppReminder } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const FILTERS = ['Tutti', 'Oggi', 'Domani', 'Questa settimana', 'Passati']

function groupByDate(appts) {
  const groups = {}
  for (const a of appts) {
    const key = format(new Date(a.appointment_date), 'yyyy-MM-dd')
    ;(groups[key] = groups[key] || []).push(a)
  }
  return groups
}

function groupLabel(dateKey) {
  const d = parseISO(dateKey)
  if (isToday(d))    return '📅 Oggi'
  if (isTomorrow(d)) return '🌅 Domani'
  return format(d, 'EEEE d MMMM yyyy', { locale: it })
}

export function AppointmentsView() {
  const { appointments, loading, add, update, remove } = useAppointments()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [filter, setFilter]       = useState('Tutti')
  const [search, setSearch]       = useState('')

  const filtered = useMemo(() => {
    let list = [...appointments]

    // text search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.client_name?.toLowerCase().includes(q) ||
          a.service_name?.toLowerCase().includes(q) ||
          a.client_phone?.includes(q),
      )
    }

    // date filter
    const now = new Date()
    if (filter === 'Oggi')            list = list.filter((a) => isToday(new Date(a.appointment_date)))
    if (filter === 'Domani')          list = list.filter((a) => isTomorrow(new Date(a.appointment_date)))
    if (filter === 'Questa settimana') list = list.filter((a) => isThisWeek(new Date(a.appointment_date), { locale: it }))
    if (filter === 'Passati')         list = list.filter((a) => new Date(a.appointment_date) < now)
    if (filter === 'Tutti')           list = list.filter((a) => new Date(a.appointment_date) >= new Date(now.toDateString()))

    return list.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }, [appointments, filter, search])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  async function handleSave(form) {
    try {
      const payload = {
        client_name:       form.client_name,
        client_phone:      form.client_phone,
        appointment_date:  new Date(form.appointment_date).toISOString(),
        service_id:        form.service_id || null,
        service_name:      form.service_name,
        service_price:     form.service_price ? Number(form.service_price) : null,
        notes:             form.notes || '',
        payment_status:    form.payment_status,
        advance_amount:    form.advance_amount ? Number(form.advance_amount) : null,
        whatsapp_reminder: form.whatsapp_reminder,
      }
      if (editing?.id) {
        await update(editing.id, payload)
        toast.success('Appuntamento aggiornato ✨')
      } else {
        const saved = await add(payload)
        toast.success('Appuntamento salvato! 🌸')
        if (form.whatsapp_reminder && saved) {
          sendWhatsAppReminder(saved)
        }
      }
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Errore nel salvataggio')
      throw err
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo appuntamento?')) return
    await remove(id)
    toast.success('Appuntamento eliminato')
  }

  function openEdit(appt) {
    setEditing(appt)
    setModalOpen(true)
  }

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  const todayCount = appointments.filter((a) => isToday(new Date(a.appointment_date))).length

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-body">Appuntamenti</h1>
          {todayCount > 0 && (
            <p className="text-sm text-muted">{todayCount} appuntament{todayCount === 1 ? 'o' : 'i'} oggi</p>
          )}
        </div>
        <button
          onClick={openNew}
          className="btn-primary rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium shadow-md"
        >
          <Plus size={16} /> Nuovo
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          className="input-base pl-9"
          placeholder="Cerca cliente, prestazione…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'btn-primary shadow-sm'
                : 'bg-surface-2 text-muted hover:bg-[var(--c-border)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted animate-pulse-soft">Caricamento…</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
          <span className="text-5xl">🌸</span>
          <p className="text-muted text-sm">Nessun appuntamento trovato</p>
          <button onClick={openNew} className="btn-primary rounded-xl px-5 py-2 text-sm font-medium mt-1">
            Aggiungi il primo
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5 pb-6">
          {Object.entries(grouped).map(([dateKey, appts]) => (
            <div key={dateKey}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 capitalize">
                {groupLabel(dateKey)}
              </p>
              <div className="space-y-2">
                {appts.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AppointmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  )
}
