#!/usr/bin/env node
/**
 * Beauty Planner — Setup Appwrite COMPLETO
 * Esegui solo se vuoi ricreare tutto da zero.
 * Usa setup-services-only.mjs se vuoi solo ricreare services.
 */
import { Client, Databases, ID, Permission, Role } from 'node-appwrite'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const ENDPOINT   = process.env.APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID
const API_KEY    = process.env.APPWRITE_API_KEY

if (!PROJECT_ID || !API_KEY) {
  console.error('❌  Mancano APPWRITE_PROJECT_ID e/o APPWRITE_API_KEY nel .env')
  process.exit(1)
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const db = new Databases(client)
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Permessi collezione: tutti gli utenti autenticati possono fare tutto
// I permessi per-documento (ownerPerms) restringono ulteriormente al solo proprietario
const colPerms = [
  Permission.create(Role.users()),
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
]

async function str(DB, col, key, size, required = true) {
  try {
    await db.createStringAttribute(DB, col, key, size, required)
    process.stdout.write('.')
    await sleep(400)
  } catch (e) {
    if (e.code !== 409) throw new Error(`Attr "${key}": ${e.message}`)
    process.stdout.write('~')
  }
}

async function bool(DB, col, key) {
  try {
    await db.createBooleanAttribute(DB, col, key, false, false)
    process.stdout.write('.')
    await sleep(400)
  } catch (e) {
    if (e.code !== 409) throw new Error(`Attr "${key}": ${e.message}`)
    process.stdout.write('~')
  }
}

;(async () => {
  console.log('\n🌸  Beauty Planner — Setup Appwrite\n')

  // Database
  console.log('📦  Creazione database...')
  let DB
  try {
    const database = await db.create(ID.unique(), 'beauty-planner')
    DB = database.$id
    console.log(`    ✅  Database: ${DB}`)
  } catch (e) {
    console.error('❌  Errore:', e.message); process.exit(1)
  }

  // Collezioni con permessi corretti
  console.log('\n📂  Creazione collezioni...')
  const cols = {}
  for (const name of ['services', 'appointments', 'payments']) {
    const col = await db.createCollection(DB, ID.unique(), name, colPerms, true)
    cols[name] = col.$id
    console.log(`    ✅  ${name}: ${col.$id}`)
  }

  // Attributi services
  process.stdout.write('\n✏️   services:     ')
  await str(DB, cols.services, 'user_id', 36)
  await str(DB, cols.services, 'icon', 10)
  await str(DB, cols.services, 'category', 50)
  await str(DB, cols.services, 'name', 2000)
  await str(DB, cols.services, 'price', 500)

  // Attributi appointments
  process.stdout.write('\n✏️   appointments: ')
  await str(DB, cols.appointments, 'user_id', 36)
  await str(DB, cols.appointments, 'client_name', 2000)
  await str(DB, cols.appointments, 'client_phone', 500, false)
  await str(DB, cols.appointments, 'appointment_date', 30)
  await str(DB, cols.appointments, 'service_id', 36, false)
  await str(DB, cols.appointments, 'service_name', 2000)
  await str(DB, cols.appointments, 'service_price', 500, false)
  await str(DB, cols.appointments, 'notes', 5000, false)
  await str(DB, cols.appointments, 'payment_status', 20, false)
  await str(DB, cols.appointments, 'advance_amount', 100, false)
  await bool(DB, cols.appointments, 'whatsapp_reminder')

  // Attributi payments
  process.stdout.write('\n✏️   payments:     ')
  await str(DB, cols.payments, 'user_id', 36)
  await str(DB, cols.payments, 'appointment_id', 36, false)
  await str(DB, cols.payments, 'type', 20)
  await str(DB, cols.payments, 'amount', 500)
  await str(DB, cols.payments, 'notes', 2000, false)
  await str(DB, cols.payments, 'client_name', 2000, false)
  await str(DB, cols.payments, 'service_name', 2000, false)
  await str(DB, cols.payments, 'appointment_date', 30, false)

  // Indici
  process.stdout.write('\n\n📊  Indici: ')
  await sleep(1500)
  const indexes = [
    [cols.services,     'idx_srv_user',       ['user_id']],
    [cols.appointments, 'idx_appt_user_date', ['user_id', 'appointment_date']],
    [cols.payments,     'idx_pay_user',       ['user_id']],
    [cols.payments,     'idx_pay_appt',       ['appointment_id']],
  ]
  for (const [col, key, attrs] of indexes) {
    try {
      await db.createIndex(DB, col, key, 'key', attrs)
      process.stdout.write('.'); await sleep(400)
    } catch (e) { process.stdout.write('~') }
  }

  console.log('\n\n' + '━'.repeat(56))
  console.log('✅  Setup completato! Copia nel .env:\n')
  console.log(`VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1`)
  console.log(`VITE_APPWRITE_PROJECT_ID=${PROJECT_ID}`)
  console.log(`VITE_APPWRITE_DATABASE_ID=${DB}`)
  console.log(`VITE_APPWRITE_COL_SERVICES=${cols.services}`)
  console.log(`VITE_APPWRITE_COL_APPOINTMENTS=${cols.appointments}`)
  console.log(`VITE_APPWRITE_COL_PAYMENTS=${cols.payments}`)
  console.log('━'.repeat(56) + '\n')
})()
