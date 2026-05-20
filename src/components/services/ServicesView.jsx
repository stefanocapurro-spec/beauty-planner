import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import { useServices } from '../../hooks/useServices'
import { SERVICE_CATEGORIES, CATEGORY_ICONS } from '../../data/services'
import { SectionHeader, EmptyState } from '../ui'
import toast from 'react-hot-toast'

const EMOJIS = ['🧖‍♀️','✨','💅','🦵','💪','💆‍♀️','💄','🌸','💋','🪷','🌺','🌷','💐','💎','🎀','🫧','🧴','🪮','⭐','🩷']

// ── Riga singola servizio ─────────────────────────────────────────────────
function ServiceRow({ svc, onDelete, onUpdate }) {
  const [editing,   setEditing]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [form,      setForm]      = useState({
    icon: svc.icon, category: svc.category, name: svc.name, price: svc.price,
  })

  const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  async function save() {
    if (!form.name.trim() || !form.price) { toast.error('Compila nome e prezzo'); return }
    setBusy(true)
    try {
      await onUpdate(svc.id, { ...form, price: Number(form.price) })
      setEditing(false)
      toast.success('Prestazione aggiornata ✨')
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await onDelete(svc.id)
      toast.success('Prestazione eliminata')
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false); setDeleting(false) }
  }

  // Modalità eliminazione con conferma
  if (deleting) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border-2 animate-fade-in"
           style={{ borderColor: 'var(--c-danger)', background: 'var(--c-surface-2)' }}>
        <AlertTriangle size={16} style={{ color: 'var(--c-danger)' }} className="flex-shrink-0" />
        <p className="text-xs text-body flex-1">Eliminare <strong>{svc.name}</strong>?</p>
        <button onClick={() => setDeleting(false)}
          className="px-3 py-1 rounded-lg border border-theme text-xs text-muted hover:bg-surface transition-colors">
          No
        </button>
        <button onClick={confirmDelete} disabled={busy}
          className="px-3 py-1 rounded-lg text-xs text-white disabled:opacity-60"
          style={{ background: 'var(--c-danger)' }}>
          {busy ? '…' : 'Sì, elimina'}
        </button>
      </div>
    )
  }

  // Modalità modifica
  if (editing) {
    return (
      <div className="card border-[var(--c-primary)] animate-fade-in p-3">
        {/* Emoji picker */}
        <p className="text-xs text-muted mb-1">Icona</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setForm(p => ({ ...p, icon: e }))}
              className={`text-lg p-1 rounded-lg transition-all ${form.icon === e
                ? 'ring-2 bg-surface-2' : 'hover:bg-surface-2'}`}
              style={form.icon === e ? { ringColor: 'var(--c-primary)' } : {}}>
              {e}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-xs text-muted mb-1">Categoria</p>
            <select className="input-base text-sm" value={form.category} onChange={f('category')}>
              {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Prezzo €</p>
            <input className="input-base text-sm" type="number" min="0" step="0.5"
              value={form.price} onChange={f('price')} />
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-muted mb-1">Nome prestazione</p>
          <input className="input-base text-sm" value={form.name} onChange={f('name')} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => setEditing(false)}
            className="flex-1 py-1.5 rounded-xl border border-theme text-xs text-muted hover:bg-surface-2 transition-colors flex items-center justify-center gap-1">
            <X size={12} /> Annulla
          </button>
          <button onClick={save} disabled={busy}
            className="flex-1 btn-primary py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 disabled:opacity-60">
            <Check size={12} /> {busy ? '…' : 'Salva'}
          </button>
        </div>
      </div>
    )
  }

  // Visualizzazione normale
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-theme bg-surface hover:border-[var(--c-accent)] transition-all group">
      <span className="text-2xl w-8 text-center flex-shrink-0">{svc.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-body truncate">{svc.name}</p>
        <p className="text-xs text-faint">{svc.category}</p>
      </div>
      <span className="text-sm font-semibold text-primary whitespace-nowrap flex-shrink-0">
        €{Number(svc.price).toFixed(2)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => { setForm({ icon: svc.icon, category: svc.category, name: svc.name, price: svc.price }); setEditing(true) }}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-primary transition-colors"
          title="Modifica">
          <Pencil size={14} />
        </button>
        <button onClick={() => setDeleting(true)}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-muted transition-colors"
          style={{}} onMouseOver={e => e.currentTarget.style.color='var(--c-danger)'}
          onMouseOut={e => e.currentTarget.style.color=''}
          title="Elimina">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Vista principale listino ──────────────────────────────────────────────
export function ServicesView() {
  const { services, loading, addService, deleteService, updateService } = useServices()
  const [showAdd, setShowAdd] = useState(false)
  const [form,    setForm]    = useState({ icon: '🌸', category: 'Altro', name: '', price: '' })
  const [busy,    setBusy]    = useState(false)

  const grouped = services.reduce((acc, s) => {
    ;(acc[s.category] = acc[s.category] || []).push(s)
    return acc
  }, {})

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { toast.error('Compila nome e prezzo'); return }
    setBusy(true)
    try {
      await addService({ ...form, price: Number(form.price) })
      toast.success('Prestazione aggiunta! 🌸')
      setForm({ icon: '🌸', category: 'Altro', name: '', price: '' })
      setShowAdd(false)
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Listino prezzi"
        subtitle={`${services.length} prestazioni`}
        action={
          <button onClick={() => setShowAdd(v => !v)}
            className="btn-primary rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium shadow-md">
            <Plus size={16} /> Aggiungi
          </button>
        }
      />

      {/* Form aggiunta nuova */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card mb-4 border-[var(--c-primary)] animate-slide-up">
          <p className="font-semibold text-body text-sm mb-3">✨ Nuova prestazione</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => setForm(p => ({ ...p, icon: e }))}
                className={`text-lg p-1 rounded-lg transition-all ${form.icon === e ? 'ring-2 bg-surface-2' : 'hover:bg-surface-2'}`}>
                {e}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-xs text-muted mb-1">Categoria</p>
              <select className="input-base text-sm" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Prezzo €</p>
              <input className="input-base text-sm" type="number" min="0" step="0.5" required
                value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs text-muted mb-1">Nome prestazione</p>
            <input className="input-base text-sm" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="es. Trattamento viso completo" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2 rounded-xl border border-theme text-sm text-muted hover:bg-surface-2 transition-colors">
              Annulla
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 btn-primary py-2 rounded-xl text-sm font-medium disabled:opacity-60">
              {busy ? '…' : 'Aggiungi'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted animate-pulse-soft">Caricamento…</p>
        </div>
      ) : services.length === 0 ? (
        <EmptyState emoji="💆‍♀️" title="Nessuna prestazione"
          subtitle="Aggiungi la prima prestazione al tuo listino"
          action="Aggiungi" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5 pb-6">
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{CATEGORY_ICONS[cat] || '🌸'}</span>
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">{cat}</h2>
                <div className="flex-1 h-px bg-[var(--c-border)]" />
                <span className="text-xs text-faint">
                  €{svcs.reduce((s, v) => s + Number(v.price), 0).toFixed(0)} tot.
                </span>
              </div>
              <div className="space-y-1.5">
                {svcs.map(s => (
                  <ServiceRow key={s.id} svc={s} onDelete={deleteService} onUpdate={updateService} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
