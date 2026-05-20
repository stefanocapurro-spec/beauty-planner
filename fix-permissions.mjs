#!/usr/bin/env node
/**
 * Aggiorna i permessi delle 3 collezioni esistenti.
 * Esegui una volta sola: node fix-permissions.mjs
 */
import { Client, Databases, Permission, Role } from 'node-appwrite'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const ENDPOINT   = process.env.APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID
const API_KEY    = process.env.APPWRITE_API_KEY
const DB_ID      = process.env.VITE_APPWRITE_DATABASE_ID
const COL_SRV    = process.env.VITE_APPWRITE_COL_SERVICES
const COL_APT    = process.env.VITE_APPWRITE_COL_APPOINTMENTS
const COL_PAY    = process.env.VITE_APPWRITE_COL_PAYMENTS

if (!PROJECT_ID || !API_KEY || !DB_ID || !COL_SRV || !COL_APT || !COL_PAY) {
  console.error('❌  Variabili mancanti nel .env'); process.exit(1)
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const db = new Databases(client)

const perms = [
  Permission.create(Role.users()),
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
]

;(async () => {
  console.log('\n🔧  Fix permessi collezioni\n')
  for (const [name, id] of [['services', COL_SRV], ['appointments', COL_APT], ['payments', COL_PAY]]) {
    try {
      await db.updateCollection(DB_ID, id, name, perms, true)
      console.log(`✅  ${name}: permessi aggiornati`)
    } catch (e) {
      console.error(`❌  ${name}: ${e.message}`)
    }
  }
  console.log('\n✅  Fatto!\n')
})()
