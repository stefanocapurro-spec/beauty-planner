import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek, parseISO, isPast } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAppointments } from '../../hooks/useAppointments'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentModal } from './AppointmentModal'
import { RescheduleModal } from './RescheduleModal'
import { sendWhatsAppReminder } from '../../lib/whatsapp'
import { SectionHeader, EmptyState } from '../ui'
import toast from 'react-hot-toast'

const FILTERS = ['Prossimi', 'Oggi', 'Domani', 'Questa settimana', 'Passati', 'Tutti']

function groupByDate(appts) {
  return appts.reduce((acc, a) => {
    const key = format(new Date(a.appointment_date), 'yyyy-MM-dd')
    ;(acc[key] = acc[key] || []).push(a)
    return acc
  }, {})
}

function groupLabel(dateKey) {
  const d = parseISO(dateKey)
  if (isToday(d))    return '📅 Oggi'
  if (isTomorrow(d)) return '🌅 Domani'
  return format(d, 'EEEE d MMMM yyyy', { locale: it })
}

export function AppointmentsView() {
  const { appointments, loading, add, update, remove } = useAppointments()
  const [modalOpen,      setModalOpen]      = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [editing,        setEditing]        = useState(null)
  const [rescheduling,   setRescheduling]   = useState(null)
  const [filter,         setFilter]         = useState('Prossimi')
  const [search,         setSearch]         = useState('')

  // ── Filtraggio ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date()
    let list = [...appointments]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.client_name?.toLowerCase().includes(q) ||
        a.service_name?.toLowerCase().includes(q) ||
        a.client_phone?.includes(q)
      )
    }

    switch (filter) {
      case 'Oggi':           list = list.filter(a => isToday(new Date(a.appointment_date))); break
      case 'Domani':         list = list.filter(a => isTomorrow(new Date(a.appointment_date))); break
      case 'Questa settimana': list = list.filter(a => isThisWeek(new Date(a.appointment_date), { locale: it })); break
      case 'Passati':        list = list.filter(a => isPast(new Date(a.appointment_date)) && !isToday(new Date(a.appointment_date))); break
      case 'Prossimi':       list = list.filter(a => !isPast(new Date(a.appointment_date)) || isToday(new Date(a.appointment_date))); break
      default: break // Tutti
    }

    return list.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }, [appointments, filter, search])

  const grouped  = useMemo(() => groupByDate(filtered), [filtered])
  const todayCount = appointments.filter(a => isToday(new Date(a.appointment_date))).length

  // ── Salva (nuovo o modifica) ────────────────────────────────────────────
  async function handleSave(form) {
    try {
      const payload = {
        client_name:       form.client_name,
        client_phone:      form.client_phone || '',
        appointment_date:  new Date(form.appointment_date).toISOString(),
        service_id:        form.service_id   || null,
        service_name:      form.service_name,
        service_price:     form.service_price != null ? String(form.service_price) : null,
        notes:             form.notes        || '',
        payment_status:    form.payment_status,
        advance_amount:    form.advance_amount ? String(form.advance_amount) : null,
        whatsapp_reminder: form.whatsapp_reminder,
      }
      if (editing?.id) {
        await update(editing.id, payload)
        toast.success('Appuntamento aggiornato ✨')
      } else {
        const saved = await add(payload)
        toast.success('Appuntamento salvato! 🌸')
        if (form.whatsapp_reminder && saved) sendWhatsAppReminder(saved)
      }
      setEditing(null)
    } catch (e) {
      toast.error(e.message || 'Errore nel salvataggio')
      throw e
    }
  }

  // ── Sposta data ─────────────────────────────────────────────────────────
  async function handleReschedule(id, changes) {
    try {
      await update(id, changes)
      toast.success('Appuntamento spostato 📅')
      setRescheduling(null)
    } catch (e) {
      toast.error(e.message)
    }
  }

  // ── Annulla appuntamento (non elimina, cambia stato) ────────────────────
  async function handleCancel(appt) {
    if (!confirm(`Annullare l'appuntamento di ${appt.client_name}?\nL'appuntamento rimarrà visibile come annullato.`)) return
    try {
      await update(appt.id, { payment_status: 'cancelled' })
      toast.success('Appuntamento annullato')
    } catch (e) {
      toast.error(e.message)
    }
  }

  // ── Segna pagato ────────────────────────────────────────────────────────
  async function handleMarkPaid(appt) {
    try {
      await update(appt.id, { payment_status: 'paid' })
      toast.success('Segnato come pagato ✅')
    } catch (e) {
      toast.error(e.message)
    }
  }

  // ── Elimina definitivamente ─────────────────────────────────────────────
  async function handleDelete(id) {
    if (!confirm('Eliminare definitivamente questo appuntamento? L\'operazione non è reversibile.')) return
    await remove(id)
    toast.success('Appuntamento eliminato')
  }

  function openEdit(appt)  { setEditing(appt); setModalOpen(true) }
  function openNew()       { setEditing(null); setModalOpen(true) }
  function openReschedule(appt) { setRescheduling(appt); setRescheduleOpen(true) }

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Agenda"
        subtitle={todayCount > 0 ? `${todayCount} appuntament${todayCount === 1 ? 'o' : 'i'} oggi` : undefined}
        action={
          <button onClick={openNew}
            className="btn-primary rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium shadow-md">
            <Plus size={16} /> Nuovo
          </button>
        }
      />

      {/* Ricerca */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input className="input-base pl-9" placeholder="Cerca cliente, prestazione…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filtri */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f ? 'btn-primary shadow-sm' : 'bg-surface-2 text-muted hover:bg-[var(--c-border)]'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted animate-pulse-soft">Caricamento…</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState emoji="🌸" title="Nessun appuntamento"
          subtitle={filter === 'Prossimi' ? 'Non ci sono appuntamenti in programma' : 'Nessun risultato per questo filtro'}
          action="Nuovo appuntamento" onAction={openNew} />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5 pb-6">
          {Object.entries(grouped).map(([dateKey, appts]) => (
            <div key={dateKey}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 capitalize">
                {groupLabel(dateKey)}
              </p>
              <div className="space-y-2">
                {appts.map(a => (
                  <AppointmentCard key={a.id} appt={a}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onReschedule={openReschedule}
                    onCancel={handleCancel}
                    onMarkPaid={handleMarkPaid}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modali */}
      <AppointmentModal open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave} initial={editing} />

      <RescheduleModal open={rescheduleOpen}
        onClose={() => { setRescheduleOpen(false); setRescheduling(null) }}
        onSave={handleReschedule} appointment={rescheduling} />
    </div>
  )
}
