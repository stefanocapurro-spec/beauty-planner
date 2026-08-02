import { useState, useEffect } from 'react'
import { Shield, Trash2, RefreshCw, AlertTriangle, UserX, KeyRound } from 'lucide-react'
import { supabase, TABLES } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import { Modal, ModalHeader, Button } from '../ui'
import toast from 'react-hot-toast'

// Reset dei propri dati: passa dal client normale, RLS lascia fare
// all'utente solo sulle proprie righe (auth.uid() = user_id).
async function deleteOwnData(userId) {
  for (const table of [TABLES.PAYMENTS, TABLES.APPOINTMENTS, TABLES.SERVICES]) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) throw error
  }
}

export function SuperAdminPanel({ onClose }) {
  const { user } = useAuth()
  const { listUsers, wipeUserData, deleteUser, resetUserPassword } = useAdminUsers()

  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [users, setUsers] = useState([])
  const [targetUserId, setTargetUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const canAct = confirm === 'RESET'

  const targetUser = users.find(u => u.id === targetUserId)
  // Le due azioni più distruttive (irreversibili anche per l'account, non solo per i dati)
  // richiedono di ridigitare l'email esatta dell'utente selezionato, non solo "RESET".
  const canActHard = canAct && targetUser && confirmEmail.trim().toLowerCase() === targetUser.email.toLowerCase()

  // Se cambio utente selezionato, la conferma email precedente non è più valida
  useEffect(() => { setConfirmEmail('') }, [targetUserId])

  useEffect(() => {
    listUsers().then(setUsers).catch(e => toast.error(e.message))
  }, [listUsers])

  async function resetOwn() {
    if (!canAct) { toast.error('Digita RESET per confermare'); return }
    setBusy(true)
    try {
      await deleteOwnData(user.id)
      toast.success('Tutti i tuoi dati sono stati eliminati 🗑️')
      setConfirm('')
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  async function resetUserData() {
    if (!canAct || !targetUserId) {
      toast.error('Seleziona un utente e digita RESET'); return
    }
    setBusy(true)
    try {
      await wipeUserData(targetUserId)
      toast.success('Dati dell\'utente eliminati')
      setConfirm(''); setTargetUserId('')
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  async function removeUser() {
    if (!canActHard) {
      toast.error('Digita RESET e ridigita l\'email esatta dell\'utente'); return
    }
    setBusy(true)
    try {
      await deleteUser(targetUserId, true)
      toast.success('Utente eliminato definitivamente')
      setConfirm(''); setTargetUserId(''); setConfirmEmail('')
      setUsers(await listUsers())
    } catch (e) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  async function changeUserPassword() {
    if (!canActHard || newPassword.length < 8) {
      toast.error('Ridigita l\'email dell\'utente e imposta una password (min. 8 caratteri)')
      return
    }
    setBusy(true)
    try {
      // I dati già cifrati dell'utente diventano illeggibili con la nuova
      // password (chiave derivata da password+userId): li rimuoviamo insieme.
      await resetUserPassword(targetUserId, newPassword, true)
      toast.success('Password aggiornata, dati precedenti rimossi')
      setConfirm(''); setTargetUserId(''); setNewPassword(''); setConfirmEmail('')
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

        {/* Selezione utente per le azioni successive */}
        <div>
          <label className="text-xs text-muted mb-1 block">Utente</label>
          <select className="input-base text-xs"
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)}>
            <option value="">Seleziona un utente...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
        </div>

        {targetUserId && (
          <div>
            <label className="text-xs text-muted mb-1 block">
              Ridigita <strong>{targetUser?.email}</strong> per abilitare eliminazione account e reset password
            </label>
            <input className="input-base text-xs" value={confirmEmail}
              onChange={e => setConfirmEmail(e.target.value)}
              placeholder="email dell'utente" />
          </div>
        )}

        {/* Reset solo dati utente */}
        <div className="card p-3" style={{ borderColor: 'var(--c-warning)' }}>
          <p className="text-xs font-semibold text-body mb-1">Reset dati utente</p>
          <p className="text-xs text-faint mb-2">
            Elimina i dati dell'utente selezionato, l'account resta attivo.
          </p>
          <button onClick={resetUserData}
            disabled={busy || !canAct || !targetUserId}
            className="w-full py-2 rounded-xl text-xs font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40 transition-colors"
            style={{ background: 'var(--c-warning)', color: 'white' }}>
            <RefreshCw size={13} /> Reset dati utente
          </button>
        </div>

        {/* Reset password utente */}
        <div className="card p-3" style={{ borderColor: 'var(--c-warning)' }}>
          <p className="text-xs font-semibold text-body mb-1">Reset password utente</p>
          <p className="text-xs text-faint mb-2">
            ⚠️ Rende illeggibili i dati cifrati precedenti dell'utente (vengono rimossi insieme al reset).
          </p>
          <input type="password" className="input-base text-xs mb-2"
            placeholder="Nuova password (min. 8 caratteri)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)} />
          <button onClick={changeUserPassword}
            disabled={busy || !canActHard || newPassword.length < 8}
            className="w-full py-2 rounded-xl text-xs font-medium flex items-center
                       justify-center gap-2 disabled:opacity-40 transition-colors"
            style={{ background: 'var(--c-warning)', color: 'white' }}>
            <KeyRound size={13} /> Imposta nuova password
          </button>
        </div>

        {/* Elimina utente */}
        <div className="card p-3" style={{ borderColor: 'var(--c-danger)' }}>
          <p className="text-xs font-semibold text-body mb-1">Elimina utente</p>
          <p className="text-xs text-faint mb-3">
            Cancella definitivamente l'account selezionato e tutti i suoi dati.
          </p>
          <Button variant="danger" size="sm" disabled={busy || !canActHard}
            onClick={removeUser} className="w-full">
            <UserX size={13} /> Elimina utente selezionato
          </Button>
        </div>

      </div>
    </Modal>
  )
}
