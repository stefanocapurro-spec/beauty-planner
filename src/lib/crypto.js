/**
 * Client-side AES-GCM encryption.
 * The encryption key is derived from the user's password + userId using PBKDF2.
 * Only ciphertext (base64) is ever stored in Supabase — plaintext never leaves the browser.
 */

const PBKDF2_ITERATIONS = 310_000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256

// ─── Key derivation ──────────────────────────────────────────────────────────

/**
 * Derives an AES-GCM CryptoKey from a password and userId.
 * The salt is deterministically derived so the same key is reproduced
 * on every login without storing it.
 */
export async function deriveKey(password, userId) {
  const encoder = new TextEncoder()
  // deterministic salt: sha-256(userId)
  const saltBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(userId))
  const salt = new Uint8Array(saltBuffer).slice(0, SALT_LENGTH)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ─── Encrypt ─────────────────────────────────────────────────────────────────

/**
 * Encrypts a JS value (any JSON-serialisable type) and returns a base64 string.
 * Format: base64(iv || ciphertext)
 */
export async function encrypt(value, cryptoKey) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = encoder.encode(JSON.stringify(value))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintext,
  )

  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), IV_LENGTH)

  return btoa(String.fromCharCode(...combined))
}

// ─── Decrypt ─────────────────────────────────────────────────────────────────

/**
 * Decrypts a base64 string produced by `encrypt` and returns the original value.
 */
export async function decrypt(base64, cryptoKey) {
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext,
  )

  return JSON.parse(new TextDecoder().decode(plaintext))
}

// ─── Encrypt / decrypt objects ───────────────────────────────────────────────

/** Encrypts every value in a plain object; keys are stored as-is. */
export async function encryptObject(obj, cryptoKey) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = await encrypt(v, cryptoKey)
  }
  return result
}

/** Decrypts every value in an object previously encrypted with encryptObject. */
export async function decryptObject(obj, cryptoKey) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    try {
      result[k] = await decrypt(v, cryptoKey)
    } catch {
      result[k] = null // field added after key change or corrupted
    }
  }
  return result
}

// ─── Selective field encryption ──────────────────────────────────────────────

const SENSITIVE_FIELDS = ['name', 'phone', 'notes', 'service_name', 'service_price', 'amount', 'data']

/**
 * Encrypts only the sensitive fields of a record.
 * Non-sensitive fields (e.g. user_id, created_at) are stored in plaintext
 * so Supabase RLS policies can still work.
 */
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
      try {
        out[field] = await decrypt(record[field], cryptoKey)
      } catch {
        out[field] = record[field] // not encrypted or already plain
      }
    }
  }
  return out
}

export async function decryptRecords(records, cryptoKey) {
  return Promise.all(records.map((r) => decryptRecord(r, cryptoKey)))
}
