/**
 * Client-side AES-GCM encryption.
 * La chiave viene derivata da password + userId con PBKDF2.
 * Solo il testo cifrato (base64) viene salvato su Supabase.
 */

const PBKDF2_ITERATIONS = 310_000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256

export async function deriveKey(password, userId) {
  const encoder = new TextEncoder()
  const saltBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(userId))
  const salt = new Uint8Array(saltBuffer).slice(0, SALT_LENGTH)

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(value, cryptoKey) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = encoder.encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext)
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), IV_LENGTH)
  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(base64, cryptoKey) {
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext)
  return JSON.parse(new TextDecoder().decode(plaintext))
}

// ─── Cifratura selettiva per record ──────────────────────────────────────
// CORRETTO: allineato esattamente ai campi che gli hook originali Appwrite
// cifravano. Non aggiungere campi qui senza verificare gli hook — un campo
// in più/meno cambia silenziosamente cosa viene esposto in chiaro nel DB.
//
//   services:     name, price
//   appointments: client_name, client_phone, service_name, notes
//                 (service_price e advance_amount restano in chiaro, come nell'originale)
//   payments:     amount, notes, client_name, service_name
const SENSITIVE_FIELDS = ['name', 'price', 'client_name', 'client_phone', 'service_name', 'notes', 'amount']

export async function encryptRecord(record, cryptoKey) {
  const out = { ...record }
  for (const field of SENSITIVE_FIELDS) {
    if (field in record && record[field] !== undefined && record[field] !== null) {
      out[field] = await encrypt(record[field], cryptoKey)
    }
  }
  return out
}

export async function decryptRecord(record, cryptoKey) {
  if (!record) return null
  const out = { ...record }
  for (const field of SENSITIVE_FIELDS) {
    if (field in record && typeof record[field] === 'string') {
      try { out[field] = await decrypt(record[field], cryptoKey) }
      catch { out[field] = record[field] }
    }
  }
  return out
}

export async function decryptRecords(records, cryptoKey) {
  return Promise.all(records.map((r) => decryptRecord(r, cryptoKey)))
}
