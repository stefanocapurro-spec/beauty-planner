import { useState } from 'react'
import { CalendarClock, Check } from 'lucide-react'
import { format } from 'date-fns'
import { Modal, ModalHeader, Button } from '../ui'

export function RescheduleModal({ open, onClose, onSave, appointment }) {
  const [newDate, setNewDate] = useState(
    appointment?.appointment_date
      ? format(new Date(appointment.appointment_date), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [notes, setNotes] = useState('')
  const [busy,  setBusy]  = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(appointment.id, {
        appointment_date: new Date(newDate).toISOString(),
        notes: notes || appointment?.notes || '',
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  if (!appointment) return null

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <ModalHeader title="📅 Sposta appuntamento" onClose={onClose} />
      <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
        <div className="rounded-xl p-3 bg-surface-2 border border-theme">
          <p className="text-xs text-muted mb-0.5">Appuntamento di</p>
          <p className="font-semibold text-body text-sm">{appointment.client_name}</p>
          <p className="text-xs text-primary">{appointment.service_name}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted mb-1 block">
            <CalendarClock size={12} className="inline mr-1" />
            Nuova data e ora
          </label>
          <input className="input-base" type="datetime-local"
            value={newDate} onChange={e => setNewDate(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs font-medium text-muted mb-1 block">
            Note (opzionale)
          </label>
          <textarea className="input-base resize-none" rows={2}
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Motivo dello spostamento…" />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? '…' : <><Check size={15} /> Conferma</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
