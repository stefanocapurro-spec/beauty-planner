// Supabase Edge Function: admin-users
// Espone operazioni privilegiate (delete user, reset password) SOLO al superadmin.
// La service_role key vive esclusivamente qui, mai nel frontend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPERADMIN_EMAIL = Deno.env.get('SUPERADMIN_EMAIL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Client "admin", usa la service_role key — usato solo server-side
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  try {
    // 1. Verifica che chi chiama sia autenticato e sia il superadmin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userErr } = await adminClient.auth.getUser(token)
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Token non valido' }), { status: 401 })
    }
    if (user.email !== SUPERADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 403 })
    }

    // 2. Esegui l'azione richiesta
    const { action, targetUserId, newPassword, wipeData } = await req.json()

    if (action === 'listUsers') {
      const { data, error } = await adminClient.auth.admin.listUsers()
      if (error) throw error
      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }))
      return new Response(JSON.stringify({ users }), { status: 200 })
    }

    if (action === 'wipeUserData') {
      // Elimina solo i dati (services/appointments/payments), mantiene l'account attivo.
      // Equivalente esatto del "Reset utente specifico" del vecchio SuperAdminPanel.
      await adminClient.from('services').delete().eq('user_id', targetUserId)
      await adminClient.from('appointments').delete().eq('user_id', targetUserId)
      await adminClient.from('payments').delete().eq('user_id', targetUserId)
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    if (action === 'deleteUser') {
      if (wipeData) {
        // Cancella prima i dati collegati (RLS non si applica qui: usiamo adminClient)
        await adminClient.from('services').delete().eq('user_id', targetUserId)
        await adminClient.from('appointments').delete().eq('user_id', targetUserId)
        await adminClient.from('payments').delete().eq('user_id', targetUserId)
      }
      const { error } = await adminClient.auth.admin.deleteUser(targetUserId)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    if (action === 'resetUserPassword') {
      // Nota: questo invalida la vecchia chiave di cifratura per quell'utente.
      // Se wipeData è true, i vecchi record cifrati (ormai illeggibili) vengono rimossi.
      if (wipeData) {
        await adminClient.from('services').delete().eq('user_id', targetUserId)
        await adminClient.from('appointments').delete().eq('user_id', targetUserId)
        await adminClient.from('payments').delete().eq('user_id', targetUserId)
      }
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      })
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Azione sconosciuta' }), { status: 400 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
