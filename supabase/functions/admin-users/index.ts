// Supabase Edge Function: admin-users
// Espone operazioni privilegiate (delete user, reset password) SOLO al superadmin.
// La service_role key vive esclusivamente qui, mai nel frontend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPERADMIN_EMAIL = Deno.env.get('SUPERADMIN_EMAIL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Client "admin", usa la service_role key — usato solo server-side
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Header CORS: necessari perché il browser chiama questa funzione da un
// dominio diverso (github.io) rispetto a quello della funzione stessa.
// Senza questi header, il browser blocca la richiesta con "Failed to fetch"
// prima ancora che la funzione venga eseguita.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Il browser invia sempre una richiesta OPTIONS di "controllo" prima del
  // POST vero e proprio quando ci sono header custom come Authorization.
  // Va gestita esplicitamente, altrimenti fallisce silenziosamente.
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Verifica che chi chiama sia autenticato e sia il superadmin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non autenticato' }, 401)
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userErr } = await adminClient.auth.getUser(token)
    if (userErr || !user) return json({ error: 'Token non valido' }, 401)
    if (user.email !== SUPERADMIN_EMAIL) return json({ error: 'Non autorizzato' }, 403)

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
      return json({ users })
    }

    if (action === 'wipeUserData') {
      await adminClient.from('services').delete().eq('user_id', targetUserId)
      await adminClient.from('appointments').delete().eq('user_id', targetUserId)
      await adminClient.from('payments').delete().eq('user_id', targetUserId)
      return json({ ok: true })
    }

    if (action === 'deleteUser') {
      if (wipeData) {
        await adminClient.from('services').delete().eq('user_id', targetUserId)
        await adminClient.from('appointments').delete().eq('user_id', targetUserId)
        await adminClient.from('payments').delete().eq('user_id', targetUserId)
      }
      const { error } = await adminClient.auth.admin.deleteUser(targetUserId)
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'resetUserPassword') {
      if (wipeData) {
        await adminClient.from('services').delete().eq('user_id', targetUserId)
        await adminClient.from('appointments').delete().eq('user_id', targetUserId)
        await adminClient.from('payments').delete().eq('user_id', targetUserId)
      }
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      })
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'Azione sconosciuta' }, 400)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
