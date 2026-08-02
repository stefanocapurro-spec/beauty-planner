import { useState, useEffect } from 'react'
import { User, Phone, Calendar, MessageSquare, CheckCircle, Plus, X, BookUser } from 'lucide-react'
import { format } from 'date-fns'
import { useServices } from '../../hooks/useServices'
import { Modal, ModalHeader, Button } from '../ui'
import { SERVICE_CATEGORIES, CATEGORY_ICONS } from '../../data/services'
import { pickContact, isContactPickerSupported } from '../../lib/contacts'
import toast from 'react-hot-toast'

const PAYMENT_OPTIONS = [
  { value: 'pending',  label: 'Da pagare',             emoji: '⏳' },
  { value: 'paid',     label: 'Pagato',                emoji: '✅' },
  { value: 'deferred', label: 'Rimandato al prossimo', emoji: '🔄' },
  { value: 'advance',  label: 'Pagamento anticipato',  emoji: '💰' },
]

const EMOJIS = ['🌸','💅','🧖‍♀️','✨','💆‍♀️','💄','🦵','💪','🦶','💎','🎀','🌺']

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted mb-1 block">{label}</label>
      {children}
    </div>
  )
}

// ── Form aggiunta nuova prestazione inline ────────────────────────────────
function AddServiceInline({ onAdd, onCancel }) {
  const [icon,     setIcon]     = useState('🌸')
  const [category, setCategory] = useState('Altro')
  const [name,     setName]     = useState('')
  const [price,    setPrice]    = useState('')
  const [busy,     setBusy]     = useState(false)

  async function handleAdd() {
    if (!name.trim() || !price) { toast.error('Inserisci nome e prezzo'); return }
    setBusy(true)
    try {
      await onAdd({ icon, category, name: name.trim(), price: Number(price) })
      toast.success('Prestazione aggiunta! 🌸')
    } catch (e) { toast.error(e.message || 'Errore') }
    finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl border-2 p-3 animate-fade-in"
         style={{ borderColor: 'var(--c-primary)', background: 'var(--c-surface-2)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-primary">✨ Nuova prestazione</p>
        <button type="button" onClick={onCancel} className="text-faint hover:text-muted"><X size={14}/></button>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => setIcon(e)}
            className={`text-base p-1 rounded-lg transition-all ${icon === e ? 'ring-2 bg-surface' : 'hover:bg-surface'}`}>
            {e}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-muted mb-1 block">Categoria</label>
          <select className="input-base text-xs" value={category} onChange={e => setCategory(e.target.value)}>
            {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Prezzo €</label>
          <input className="input-base text-xs" type="number" min="0" step="0.5"
            value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs text-muted mb-1 block">Nome prestazione</label>
        <input className="input-base text-xs" value={name} onChange={e => setName(e.target.value)}
          placeholder="es. Trattamento viso completo" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 rounded-xl border border-theme text-xs text-muted hover:bg-surface transition-colors">
          Annulla
        </button>
        <button type="button" onClick={handleAdd} disabled={busy}
          className="flex-1 btn-primary py-1.5 rounded-xl text-xs font-medium disabled:opacity-60">
          {busy ? '…' : 'Aggiungi'}
        </button>
      </div>
    </div>
  )
}

// ── Modale principale ─────────────────────────────────────────────────────
export function AppointmentModal({ open, onClose, onSave, initial }) {
  const { services, addService } = useServices()
  const isEdit = !!initial?.id
  const [showAddService, setShowAddService] = useState(false)
  const [pickingContact, setPickingContact] = useState(false)

  const blank = {
    client_name: '', client_phone: '',
    appointment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    // service_id ora può contenere più ID separati da virgola (multi-selezione).
    // service_name/service_price restano il "riassunto" (nomi uniti, totale)
    // così il resto dell'app che li legge non cambia comportamento.
    service_id: '', service_name: '', service_price: '',
    notes: '', payment_status: 'pending',
    advance_amount: '', whatsapp_reminder: false,
  }
  const [form, setForm] = useState(blank)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setShowAddService(false)
      setForm(initial ? {
        ...blank, ...initial,
        appointment_date: initial.appointment_date
          ? format(new Date(initial.appointment_date), "yyyy-MM-dd'T'HH:mm")
          : blank.appointment_date,
      } : blank)
    }
  }, [open, initial])

  const field = key => e =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // ── Importa dalla rubrica ─────────────────────────────────────────────
  async function handlePickContact() {
    setPickingContact(true)
    try {
      const contact = await pickContact()
      if (!contact) return
      setForm(f => ({
        ...f,
        client_name:  contact.name  || f.client_name,
        client_phone: contact.phone || f.client_phone,
      }))
      toast.success('Contatto importato! 📱')
    } catch (e) {
      toast.error('Impossibile aprire la rubrica')
    } finally {
      setPickingContact(false)
    }
  }

  // ── Selezione multipla prestazioni ────────────────────────────────────
  const selectedIds = form.service_id ? String(form.service_id).split(',').filter(Boolean) : []

  function applySelection(ids) {
    const selected = ids.map(id => services.find(s => s.id === id)).filter(Boolean)
    setForm(f => ({
      ...f,
      service_id: ids.join(','),
      service_name: selected.map(s => s.name).join(', '),
      service_price: selected.reduce((sum, s) => sum + Number(s.price), 0),
    }))
  }

  function toggleService(id) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    applySelection(next)
  }

  async function handleAddService(data) {
    const newSvc = await addService(data)
    applySelection([...selectedIds, newSvc.id])
    setShowAddService(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (selectedIds.length === 0) {
      toast.error('Seleziona almeno una prestazione')
      return
    }
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

  const canPickContact = isContactPickerSupported()

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title={isEdit ? '✏️ Modifica appuntamento' : '✨ Nuovo appuntamento'}
        onClose={onClose}
      />
      <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">

        {/* Cliente */}
        <div className="flex flex-col gap-3">
          {/* Pulsante rubrica — solo se supportato */}
          {canPickContact && (
            <button type="button" onClick={handlePickContact} disabled={pickingContact}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 text-sm font-medium transition-all disabled:opacity-60"
              style={{ borderColor: 'var(--c-primary)', color: 'var(--c-primary)', background: 'var(--c-surface-2)' }}>
              <BookUser size={16} />
              {pickingContact ? 'Apertura rubrica…' : 'Importa dalla rubrica'}
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="👤 Nome cliente">
              <input className="input-base" value={form.client_name}
                onChange={field('client_name')} placeholder="Nome e cognome" required />
            </Field>
            <Field label="📞 Telefono">
              <input className="input-base" type="tel" value={form.client_phone}
                onChange={field('client_phone')} placeholder="+39 320 …" />
            </Field>
          </div>
        </div>

        {/* Data e ora */}
        <Field label="📅 Data e ora">
          <input className="input-base" type="datetime-local"
            value={form.appointment_date} onChange={field('appointment_date')} required />
        </Field>

        {/* Prestazioni — selezione multipla */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted">💆‍♀️ Prestazioni</label>
            {!showAddService && (
              <button type="button" onClick={() => setShowAddService(true)}
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--c-primary)' }}>
                <Plus size={13} /> Aggiungi nuova all'elenco
              </button>
            )}
          </div>

          {!showAddService && (
            <>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-theme divide-y divide-theme">
                {Object.entries(grouped).map(([cat, svcs]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-faint px-3 pt-2 pb-1 bg-surface-2 sticky top-0">
                      {CATEGORY_ICONS[cat] || '🌸'} {cat}
                    </p>
                    {svcs.map(s => (
                      <label key={s.id}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-2 transition-colors">
                        <input type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleService(s.id)}
                          className="accent-[var(--c-primary)] w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1 truncate text-body">{s.icon} {s.name}</span>
                        <span className="text-xs text-muted flex-shrink-0">€{s.price}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              {selectedIds.length > 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--c-primary)' }}>
                  {selectedIds.length} prestazion{selectedIds.length === 1 ? 'e' : 'i'} selezionat{selectedIds.length === 1 ? 'a' : 'e'} — Totale €{Number(form.service_price).toFixed(2)}
                </p>
              )}
            </>
          )}

          {showAddService && (
            <AddServiceInline onAdd={handleAddService} onCancel={() => setShowAddService(false)} />
          )}
        </div>

        {/* Note */}
        <Field label="📝 Note (opzionale)">
          <textarea className="input-base resize-none" rows={2}
            value={form.notes} onChange={field('notes')}
            placeholder="Preferenze, allergie, richieste speciali…" />
        </Field>

        {/* Pagamento */}
        <div>
          <p className="text-xs font-medium text-muted mb-2">💳 Pagamento</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <label key={opt.value}
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  form.payment_status === opt.value
                    ? 'border-[var(--c-primary)] bg-surface-2'
                    : 'border-theme hover:border-[var(--c-accent)]'
                }`}>
                <input type="radio" name="payment_status" value={opt.value}
                  checked={form.payment_status === opt.value}
                  onChange={field('payment_status')} className="sr-only" />
                <span>{opt.emoji}</span>
                <span className="text-xs font-medium text-body">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Anticipo */}
        {form.payment_status === 'advance' && (
          <Field label="💰 Importo anticipato (€)">
            <input className="input-base" type="number" min="0" step="0.01"
              value={form.advance_amount} onChange={field('advance_amount')} placeholder="0.00" />
            {residuo !== null && (
              <p className="text-xs mt-1"
                 style={{ color: residuo <= 0 ? 'var(--c-success)' : 'var(--c-warning)' }}>
                {residuo > 0
                  ? `Residuo da saldare: €${residuo.toFixed(2)}`
                  : `Saldato${residuo < 0 ? ` — Credito: €${Math.abs(residuo).toFixed(2)}` : ''}`}
              </p>
            )}
          </Field>
        )}

        {/* WhatsApp */}
        <label className="flex items-center gap-3 p-3 rounded-xl border border-theme hover:border-[var(--c-accent)] cursor-pointer transition-all">
          <input type="checkbox" checked={form.whatsapp_reminder}
            onChange={field('whatsapp_reminder')}
            className="accent-[var(--c-primary)] w-4 h-4" />
          <span className="text-sm text-body">📱 Invia promemoria WhatsApp</span>
        </label>

        {/* Azioni */}
        <div className="flex gap-3 mt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">Annulla</Button>
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? '…' : <><CheckCircle size={15} /> Salva</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
