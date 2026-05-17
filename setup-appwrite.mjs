#!/usr/bin/env node
/**
 * Beauty Planner — Script di setup Appwrite
 * Esegui UNA SOLA VOLTA dopo aver creato il progetto Appwrite.
 *
 * Uso:
 *   node setup-appwrite.mjs
 *
 * Variabili richieste nel .env:
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY   (con tutti gli scope databases + deprecated)
 */

import { Client, Databases, ID } from 'node-appwrite'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const ENDPOINT   = process.env.APPWRITE_ENDPOINT   || 'https://cloud.appwrite.io/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID  || process.env.VITE_APPWRITE_PROJECT_ID
const API_KEY    = process.env.APPWRITE_API_KEY

if (!PROJECT_ID || !API_KEY) {
  console.error('\n❌  Mancano APPWRITE_PROJECT_ID e/o APPWRITE_API_KEY nel file .env\n')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const db = new Databases(client)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Crea attributo con gestione errori ───────────────────────────────────
async function str(dbId, colId, key, size, required) {
  try {
    // Nota: NO default sui required, NO required con default — regola Appwrite
    await db.createStringAttribute(dbId, colId, key, size, required)
    process.stdout.write('.')
    await sleep(350)
  } catch (e) {
    if (e.code === 409) { process.stdout.write('~') }   // già esiste
    else throw new Error(`Attr "${key}": ${e.message}`)
  }
}

async function bool(dbId, colId, key, required, defaultVal) {
  try {
    await db.createBooleanAttribute(dbId, colId, key, required, defaultVal)
    process.stdout.write('.')
    await sleep(350)
  } catch (e) {
    if (e.code === 409) { process.stdout.write('~') }
    else throw new Error(`Attr "${key}": ${e.message}`)
  }
}

async function idx(dbId, colId, key, attrs) {
  try {
    await db.createIndex(dbId, colId, key, 'key', attrs)
    process.stdout.write('.')
    await sleep(450)
  } catch (e) {
    if (e.code === 409) { process.stdout.write('~') }
    else console.warn(`\n  ⚠️  Indice ${key}: ${e.message}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────
;(async () => {
  console.log('\n🌸  Beauty Planner — Setup Appwrite\n')

  // 1. Database
  console.log('📦  Creazione database...')
  let database
  try {
    database = await db.create(ID.unique(), 'beauty-planner')
    console.log(`    ✅  Database creato: ${database.$id}`)
  } catch (e) {
    console.error('❌  Errore creazione database:', e.message)
    process.exit(1)
  }
  const DB = database.$id

  // 2. Collezioni
  console.log('\n📂  Creazione collezioni...')
  const cols = {}
  for (const name of ['services', 'appointments', 'payments']) {
    try {
      const c = await db.createCollection(DB, ID.unique(), name)
      cols[name] = c.$id
      console.log(`    ✅  ${name}: ${c.$id}`)
    } catch (e) {
      console.error(`❌  Errore collezione ${name}:`, e.message)
      process.exit(1)
    }
  }

  // 3. Attributi
  console.log('\n✏️   Creazione attributi')

  // services
  process.stdout.write('\n   services:     ')
  await str(DB, cols.services, 'user_id',  36,   true)
  await str(DB, cols.services, 'icon',     10,   true)
  await str(DB, cols.services, 'category', 50,   true)
  await str(DB, cols.services, 'name',     2000, true)
  await str(DB, cols.services, 'price',    500,  true)

  // appointments
  process.stdout.write('\n   appointments: ')
  await str(DB, cols.appointments, 'user_id',           36,   true)
  await str(DB, cols.appointments, 'client_name',       2000, true)
  await str(DB, cols.appointments, 'client_phone',      500,  false)
  await str(DB, cols.appointments, 'appointment_date',  30,   true)
  await str(DB, cols.appointments, 'service_id',        36,   false)
  await str(DB, cols.appointments, 'service_name',      2000, true)
  await str(DB, cols.appointments, 'service_price',     500,  false)
  await str(DB, cols.appointments, 'notes',             5000, false)
  await str(DB, cols.appointments, 'payment_status',    20,   false)  // optional → default gestito nel codice
  await str(DB, cols.appointments, 'advance_amount',    100,  false)
  await bool(DB, cols.appointments, 'whatsapp_reminder', false, false)

  // payments
  process.stdout.write('\n   payments:     ')
  await str(DB, cols.payments, 'user_id',          36,   true)
  await str(DB, cols.payments, 'appointment_id',   36,   false)
  await str(DB, cols.payments, 'type',             20,   true)
  await str(DB, cols.payments, 'amount',           500,  true)
  await str(DB, cols.payments, 'notes',            2000, false)
  await str(DB, cols.payments, 'client_name',      2000, false)
  await str(DB, cols.payments, 'service_name',     2000, false)
  await str(DB, cols.payments, 'appointment_date', 30,   false)

  // 4. Indici
  process.stdout.write('\n\n📊  Creazione indici: ')
  await sleep(1500)   // aspetta che gli attributi siano attivi
  await idx(DB, cols.services,     'idx_srv_user',       ['user_id'])
  await idx(DB, cols.appointments, 'idx_appt_user_date', ['user_id', 'appointment_date'])
  await idx(DB, cols.payments,     'idx_pay_user',       ['user_id'])
  await idx(DB, cols.payments,     'idx_pay_appt',       ['appointment_id'])

  // 5. Stampa valori .env
  console.log('\n\n' + '━'.repeat(56))
  console.log('✅  Setup completato! Copia nel file .env:\n')
  console.log(`VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1`)
  console.log(`VITE_APPWRITE_PROJECT_ID=${PROJECT_ID}`)
  console.log(`VITE_APPWRITE_DATABASE_ID=${DB}`)
  console.log(`VITE_APPWRITE_COL_SERVICES=${cols.services}`)
  console.log(`VITE_APPWRITE_COL_APPOINTMENTS=${cols.appointments}`)
  console.log(`VITE_APPWRITE_COL_PAYMENTS=${cols.payments}`)
  console.log('━'.repeat(56))
  console.log('\nAggiungi gli stessi valori anche nei GitHub Secrets.\n')
})()
