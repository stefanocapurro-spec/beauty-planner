import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useServices } from '../../hooks/useServices'
import { SERVICE_CATEGORIES, CATEGORY_ICONS } from '../../data/services'
import toast from 'react-hot-toast'

const EMOJI_OPTIONS = ['🧖‍♀️','✨','💅','🦵','💪','💆‍♀️','💄','🌸','💋','👄','🪷','🌺','🌷','💐','🫧','🧴','🪮','💎','⭐','🎀']

function ServiceRow({ svc, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ icon: svc.icon, category: svc.category, name: svc.name, price: svc.price })

  async function save() {
    try {
      await onUpdate(svc.id, { ...form, price: Number(form.price) })
      setEditing(false)
      toast.success('Aggiornato!')
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (editing) {
    return (
      <div className="card border-[var(--c-primary)] animate-fade-in">
        <div className="grid grid-cols-1 gap-2">
          {/* Emoji picker */}
          <div>
            <p className="text-xs text-muted mb-1">Icona</p>
            <div className="flex flex-wrap gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: e }))}
                  className={`text-lg p-1 rounded-lg transition-all ${form.icon === e ? 'bg-surface-2 ring-2 ring-[var(--c-primary)]' : 'hover:bg-surface-2'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted mb-1">Categoria</p>
              <select className="input-base text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Prezzo €</p>
              <input className="input-base text-sm" type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Nome</p>
            <input className="input-base text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={() => setEditing(false)} className="flex-1 py-1.5 rounded-xl border border-theme text-xs text-muted hover:bg-surface-2 transition-colors flex items-center justify-center gap-1"><X size={12} />Annulla</button>
            <button onClick={save} className="flex-1 btn-primary py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"><Check size={12} />Salva</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-theme bg-surface hover:border-[var(--c-accent)] transition-all group">
      <span className="text-2xl w-8 text-center">{svc.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-body truncate">{svc.name}</p>
        <p className="text-xs text-faint">{svc.category}</p>
      </div>
      <span className="text-sm font-semibold text-primary whitespace-nowrap">€{svc.price}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setForm({ icon: svc.icon, category: svc.category, name: svc.name, price: svc.price }); setEditing(true) }}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-primary transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(svc.id)}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-muted transition-colors"
          onMouseOver={(e) => e.currentTarget.style.color='var(--c-danger)'}
          onMouseOut={(e) => e.currentTarget.style.color=''}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export function ServicesView() {
  const { services, loading, addService, deleteService, updateService } = useServices()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ icon: '🌸', category: 'Altro', name: '', price: '' })

  const grouped = services.reduce((acc, s) => {
    ;(acc[s.category] = acc[s.category] || []).push(s)
    return acc
  }, {})

  async function handleAdd(e) {
    e.preventDefault()
    try {
      await addService({ ...form, price: Number(form.price) })
      toast.success('Prestazione aggiunta! 🌸')
      setForm({ icon: '🌸', category: 'Altro', name: '', price: '' })
      setShowAdd(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questa prestazione?')) return
    await deleteService(id)
    toast.success('Prestazione eliminata')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-body">Listino prezzi</h1>
          <p className="text-sm text-muted">{services.length} prestazioni</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="btn-primary rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium shadow-md"
        >
          <Plus size={16} /> Aggiungi
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card mb-5 border-[var(--c-primary)] animate-slide-up">
          <h3 className="font-semibold text-body mb-3 text-sm">Nuova prestazione</h3>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-muted mb-1">Icona</p>
              <div className="flex flex-wrap gap-1">
                {['🌸','💅','🧖‍♀️','✨','💆‍♀️','💄','🦵','💪','🪷','🌺','🌷','💐','💎','🎀','🫧'].map((e) => (
                  <button key={e} type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: e }))}
                    className={`text-lg p-1 rounded-lg transition-all ${form.icon === e ? 'bg-surface-2 ring-2 ring-[var(--c-primary)]' : 'hover:bg-surface-2'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted mb-1">Categoria</p>
                <select className="input-base text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Prezzo €</p>
                <input className="input-base text-sm" type="number" min="0" step="0.5" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Nome prestazione</p>
              <input className="input-base text-sm" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="es. Trattamento viso completo" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-theme text-sm text-muted hover:bg-surface-2 transition-colors">Annulla</button>
              <button type="submit" className="flex-1 btn-primary py-2 rounded-xl text-sm font-medium">Aggiungi</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted animate-pulse-soft">Caricamento…</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5 pb-6">
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{CATEGORY_ICONS[cat] || '🌸'}</span>
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">{cat}</h2>
                <div className="flex-1 h-px bg-[var(--c-border)]" />
              </div>
              <div className="space-y-1.5">
                {svcs.map((s) => (
                  <ServiceRow key={s.id} svc={s} onDelete={handleDelete} onUpdate={updateService} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
