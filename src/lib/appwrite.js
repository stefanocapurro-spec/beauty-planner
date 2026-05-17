import { Client, Account, Databases, ID, Query, Permission, Role } from 'appwrite'

const endpoint  = import.meta.env.VITE_APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1'
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID

if (!projectId) throw new Error('VITE_APPWRITE_PROJECT_ID mancante nel file .env')

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)

export const account   = new Account(client)
export const databases = new Databases(client)

// ── Costanti collezioni ───────────────────────────────────────────────────
export const DB_ID      = import.meta.env.VITE_APPWRITE_DATABASE_ID
export const COL = {
  SERVICES:     import.meta.env.VITE_APPWRITE_COL_SERVICES,
  APPOINTMENTS: import.meta.env.VITE_APPWRITE_COL_APPOINTMENTS,
  PAYMENTS:     import.meta.env.VITE_APPWRITE_COL_PAYMENTS,
}

// ── Re-export utility ─────────────────────────────────────────────────────
export { ID, Query, Permission, Role }

// ── Helper permessi per-documento (solo l'utente proprietario) ────────────
export function ownerPerms(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}
