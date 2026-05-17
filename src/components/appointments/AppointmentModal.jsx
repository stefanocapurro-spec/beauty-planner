import { useState, useEffect } from 'react'
import { User, Phone, Calendar, MessageSquare, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useServices } from '../../hooks/useServices'
import { Modal, ModalHeader, Button } from '../ui'

const PAYMENT_OPTIONS = [
  { value: 'pending',  label: 'Da pagare',             emoji: '⏳' },
  { value: 'paid',     label: 'Pagato',                emoji: '✅' },
  { value: 'deferred', label: 'Rimandato al prossimo', emoji: '🔄' },
  { value: 'advance',  label: 'Pagamento anticipato',  emoji: '💰' },
]

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      {children}
    </div>
  )
}

export function AppointmentModal({ open, onClose, onSave, initial }) {
  const { services } = useServices()
  const isEdit = !!initial?.id

  const blank = {
    client_name: '', client_phone: '',
    appointment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    service_id: '', service_name: '', service_price: '',
    notes: '', payment_status: 'pending',
    advance_amount: '', whatsapp_reminder: false,
  }

  const [form, setForm] = useState(blank)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        ...blank, ...initial,
        appointment_date: initial.appointment_date
          ? format(new Date(initial.appointment_date), "yyyy-MM-dd'T'HH:mm")
          : blank.appointment_date,
      } : blank)
    }
  }, [open, initial])

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function selectService(id) {
    const svc = services.find((s) => s.id === id)
    setForm((f) => ({ ...f, service_id: id, service_name: svc?.name ?? '', service_price: svc?.price ?? '' }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    try { await onSave(form); onClose() }
    finally { setBusy(false) }
  }

  const grouped = services.reduce((acc, s) => {
    ;(acc[s.category] = acc[s.category] || []).push(s)
    return acc
  }, {})

  const residuo = form.service_price && form.advance_amount
    ? Number(form.service_price) - Number(form.advance_amount) : null

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={isEdit ? '✏️ Modifica appuntamento' : '✨ Nuovo appuntamento'} onClose={onClose} />
      <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome cliente" icon={User}>
            <input className="input-base" value={form.client_name} onChange={field('client_name')} placeholder="Nome e cognome" required />
          </Field>
          <Field label="Telefono" icon={Phone}>
            <input className="input-base" type="tel" value={form.client_phone} onChange={field('client_phone')} placeholder="+39 320 …" />
          </Field>
        </div>
        <Field label="Data e ora" icon={Calendar}>
          <input className="input-base" type="datetime-local" value={form.appointment_date} onChange={field('appointment_date')} required />
        </Field>
        <Field label="💆‍♀️ Prestazione">
          <select className="input-base" value={form.service_id} onChange={(e) => selectService(e.target.value)} required>
            <option value="">Seleziona una prestazione…</option>
            {Object.entries(grouped).map(([cat, svcs]) => (
              <optgroup key={cat} label={cat}>
                {svcs.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name} — €{s.price}</option>)}
              </optgroup>
            ))}
          </select>
          {form.service_price && <p className="text-xs text-primary mt-1">Prezzo: €{form.service_price}</p>}
        </Field>
        <Field label="Note (opzionale)" icon={MessageSquare}>
          <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={field('notes')} placeholder="Preferenze, allergie, richieste speciali…" />
        </Field>
        <div>
          <p className="text-xs font-medium text-muted mb-2">💳 Pagamento</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.value} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${form.payment_status === opt.value ? 'border-[var(--c-primary)] bg-surface-2' : 'border-theme hover:border-[var(--c-accent)]'}`}>
                <input type="radio" name="payment_status" value={opt.value} checked={form.payment_status === opt.value} onChange={field('payment_status')} className="sr-only" />
                <span>{opt.emoji}</span>
                <span className="text-xs font-medium text-body">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        {form.payment_status === 'advance' && (
          <Field label="💰 Importo anticipato (€)">
            <input className="input-base" type="number" min="0" step="0.01" value={form.advance_amount} onChange={field('advance_amount')} placeholder="0.00" />
            {residuo !== null && (
              <p className="text-xs mt-1" style={{ color: residuo <= 0 ? 'var(--c-success)' : 'var(--c-warning)' }}>
                {residuo > 0 ? `Residuo da saldare: €${residuo.toFixed(2)}` : `Saldato${residuo < 0 ? ` — Credito: €${Math.abs(residuo).toFixed(2)}` : ''}`}
              </p>
            )}
          </Field>
        )}
        <label className="flex items-center gap-3 p-3 rounded-xl border border-theme hover:border-[var(--c-accent)] cursor-pointer transition-all">
          <input type="checkbox" checked={form.whatsapp_reminder} onChange={field('whatsapp_reminder')} className="accent-[var(--c-primary)] w-4 h-4" />
          <span className="text-sm text-body">📱 Invia promemoria WhatsApp</span>
        </label>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? '…' : <><CheckCircle size={15} /> Salva</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
