import { useState } from 'react'
import { Shield, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { databases, DB_ID, COL, Query } from '../../lib/appwrite'
import { useAuth } from '../../hooks/useAuth'
import { Modal, ModalHeader, Button } from '../ui'
import toast from 'react-hot-toast'

async function deleteAllForUser(userId) {
  for (const col of [COL.PAYMENTS, COL.APPOINTMENTS, COL.SERVICES]) {
    let total = Infinity, deleted = 0
    while (deleted < total) {
      const res = await databases.listDocuments(DB_ID, col, [
        Query.equal('user_id', userId), Query.limit(100),
      ])
      total = res.total
      if (res.documents.length === 0) break
      await Promise.all(res.documents.map(d => databases.deleteDocument(DB_ID, col, d.$id)))
      deleted += res.documents.length
    }
  }
}

export function SuperAdminPanel({ onClose }) {
  const { user } = useAuth()
  const [confirm,      setConfirm]      = useState('')
  const [busy,         setBusy]         = useState(false)
  const [targetUserId, setTargetUserId] = useState('')
  const canAct = confirm === 'RESET'

  async function resetOwn() {
    if (!canAct) { toast.error('Digita RESET per confermare'); return }
    setBusy(true)
    try {
      await deleteAllForUser(user.$id)
      toast.success('Tutti i tuoi dati sono stati eliminati 🗑️')
      setConfirm('')
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  async function resetUser() {
    if (!canAct || !targetUserId.trim()) {
      toast.error('Inserisci un User ID e digita RESET'); return
    }
    setBusy(true)
    try {
      await deleteAllForUser(targetUserId.trim())
      toast.success(`Dati dell'utente eliminati`)
      setConfirm(''); setTargetUserId('')
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <ModalHeader title="🛠 Superadmin" onClose={onClose} />
      <div className="p-5 space-y-4">

        <div className="rounded-xl p-3 flex items-start gap-2"
             style={{ background: 'var(--c-warning)20', border: '1px solid var(--c-warning)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--c-warning)' }} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs text-body">
            Operazioni <strong>irreversibili</strong>. I dati vengono eliminati definitivamente.
          </p>
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">
            Digita <strong>RESET</strong> per abilitare le azioni
          </label>
          <input className="input-base" value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="RESET" />
        </div>

        {/* Reset dati personali */}
        <div className="card p-3" style={{ borderColor: 'var(--c-danger)' }}>
          <p className="text-xs font-semibold text-body mb-1">Reset dati personali</p>
          <p className="text-xs text-faint mb-3">
            Elimina appuntamenti, pagamenti e prestazioni del tuo account.
          </p>
          <Button variant="danger" size="sm" disabled={busy || !canAct}
            onClick={resetOwn} className="w-full">
            <Trash2 size={13} /> Elimina tutti i miei dati
          </Button>
        </div>

        {/* Reset utente specifico tramite User ID */}
        <div className="card p-3" style={{ borderColor: 'var(--c-warning)' }}>
          <p className="text-xs font-semibold text-body mb-1">Reset utente specifico</p>
          <p className="text-xs text-faint mb-2">
            Inserisci l'<strong>User ID</strong> Appwrite (visibile in Appwrite Console → Auth → Users).
          </p>
          <input className="input-base text-xs mb-2 font-mono"
            placeholder="6507c9a8b3f2d..."
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)} />
          <button onClick={resetUser}
            disabled={busy || !canAct || !targetUserId}
            className="w-full py-2 rounded-xl text-xs font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40 transition-colors"
            style={{ background: 'var(--c-warning)', color: 'white' }}>
            <RefreshCw size={13} /> Reset utente
          </button>
        </div>

      </div>
    </Modal>
  )
}
