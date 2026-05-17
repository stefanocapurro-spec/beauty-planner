import { format } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * Generates a WhatsApp deep-link URL with a pre-filled reminder message.
 * Opens the WhatsApp chat (web or app) with the message already composed.
 */
export function buildWhatsAppReminderURL(appointment) {
  const { client_name, client_phone, appointment_date, service_name } = appointment

  // Normalise phone: remove spaces/dashes, ensure +39 prefix for Italian numbers
  let phone = (client_phone || '').replace(/[\s\-().]/g, '')
  if (!phone.startsWith('+')) {
    if (phone.startsWith('0') || phone.startsWith('3')) {
      phone = '+39' + phone
    } else {
      phone = '+' + phone
    }
  }

  const dateFormatted = format(new Date(appointment_date), "EEEE d MMMM 'alle' HH:mm", { locale: it })

  const message =
    `Ciao ${client_name}! 💐\n` +
    `Ti ricordo il tuo appuntamento per *${service_name}* ` +
    `${dateFormatted}.\n` +
    `A presto! ✨`

  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encoded}`
}

/**
 * Opens the WhatsApp reminder in a new tab.
 */
export function sendWhatsAppReminder(appointment) {
  const url = buildWhatsAppReminderURL(appointment)
  window.open(url, '_blank', 'noopener,noreferrer')
}
