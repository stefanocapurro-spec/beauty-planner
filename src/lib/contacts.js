/**
 * Contact Picker API — apre la rubrica nativa del dispositivo.
 * Supportata su Android Chrome e iOS Safari 14.5+.
 * Su desktop o browser non supportati restituisce null silenziosamente.
 */

export function isContactPickerSupported() {
  return !!(navigator.contacts && navigator.contacts.select)
}

/**
 * Apre la rubrica e restituisce { name, phone } oppure null
 * se l'utente annulla o il browser non supporta l'API.
 */
export async function pickContact() {
  if (!isContactPickerSupported()) return null

  try {
    const results = await navigator.contacts.select(
      ['name', 'tel'],
      { multiple: false }
    )

    if (!results || results.length === 0) return null

    const contact = results[0]

    // name è un array di stringhe, prendi il primo non vuoto
    const name = (contact.name || []).find(n => n?.trim()) || ''

    // tel è un array di stringhe, prendi il primo non vuoto
    const phone = (contact.tel || []).find(t => t?.trim()) || ''

    return { name: name.trim(), phone: phone.trim() }
  } catch (e) {
    // L'utente ha annullato o permesso negato → silenzioso
    if (e.name !== 'AbortError') console.warn('[ContactPicker]', e)
    return null
  }
}
