#!/usr/bin/env node
import { Client, Databases, ID, Permission, Role } from 'node-appwrite'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const ENDPOINT   = process.env.APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID
const API_KEY    = process.env.APPWRITE_API_KEY
const DB_ID      = process.env.VITE_APPWRITE_DATABASE_ID

if (!PROJECT_ID || !API_KEY || !DB_ID) {
  console.error('❌  Variabili mancanti nel .env (APPWRITE_PROJECT_ID, APPWRITE_API_KEY, VITE_APPWRITE_DATABASE_ID)')
  process.exit(1)
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const db = new Databases(client)
const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  console.log('\n🌸  Ricreazione tabella services\n')

  // Crea collezione CON permessi utenti autenticati + document security
  let colId
  try {
    const col = await db.createCollection(
      DB_ID,
      ID.unique(),
      'services',
      [
        // Utenti autenticati possono creare documenti
        Permission.create(Role.users()),
        // Lettura/modifica/cancellazione gestita a livello di documento (ownerPerms)
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      true  // documentSecurity = true → i permessi per-documento sono abilitati
    )
    colId = col.$id
    console.log(`✅  Collezione creata: ${colId}`)
  } catch (e) {
    console.error('❌  Errore creazione collezione:', e.message)
    process.exit(1)
  }

  // Attributi
  console.log('✏️   Attributi: ')
  for (const [key, size] of [['user_id',36],['icon',10],['category',50],['name',2000],['price',500]]) {
    try {
      await db.createStringAttribute(DB_ID, colId, key, size, true)
      process.stdout.write('.')
      await sleep(400)
    } catch (e) { console.warn(`\n  ⚠️  ${key}: ${e.message}`) }
  }

  // Indice
  console.log('\n📊  Indice: ')
  await sleep(1500)
  try {
    await db.createIndex(DB_ID, colId, 'idx_srv_user', 'key', ['user_id'])
    process.stdout.write('.\n')
  } catch (e) { console.warn(`  ⚠️  ${e.message}`) }

  console.log('\n' + '━'.repeat(56))
  console.log('✅  Fatto! Aggiorna il .env:\n')
  console.log(`VITE_APPWRITE_COL_SERVICES=${colId}`)
  console.log('━'.repeat(56) + '\n')
})()
