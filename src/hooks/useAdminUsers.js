import { supabase } from '../lib/supabase'

// Da usare solo nel pannello Superadmin, protetto da isSuperAdmin lato UI
// (la vera protezione è comunque server-side, nella Edge Function)

export function useAdminUsers() {
  const callAdmin = async (payload) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Errore operazione admin')
    return data
  }

  const listUsers = async () => {
    const { users } = await callAdmin({ action: 'listUsers' })
    return users
  }

  const wipeUserData = (targetUserId) =>
    callAdmin({ action: 'wipeUserData', targetUserId })

  const deleteUser = (targetUserId, wipeData = true) =>
    callAdmin({ action: 'deleteUser', targetUserId, wipeData })

  const resetUserPassword = (targetUserId, newPassword, wipeData = true) =>
    callAdmin({ action: 'resetUserPassword', targetUserId, newPassword, wipeData })

  return { listUsers, wipeUserData, deleteUser, resetUserPassword }
}
