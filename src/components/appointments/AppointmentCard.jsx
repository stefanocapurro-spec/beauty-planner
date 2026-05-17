import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { it } from 'date-fns/locale'
import { Pencil, Trash2, MessageCircle, Clock, Phone } from 'lucide-react'
import { sendWhatsAppReminder } from '../../lib/whatsapp'

const STATUS_CONFIG = {
  pending:  { label: 'Da pagare',   emoji: '⏳', css: 'badge-warning' },
  paid:     { label: 'Pagato',      emoji: '✅', css: 'badge-success' },
  deferred: { label: 'Rimandato',   emoji: '🔄', css: 'badge-neutral' },
  advance:  { label: 'Anticipo',    emoji: '💰', css: 'badge-neutral' },
}

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))    return { label: 'Oggi',   highlight: true }
  if (isTomorrow(d)) return { label: 'Domani', highlight: true }
  return { label: format(d, 'EEE d MMM', { locale: it }), highlight: false }
}

export function AppointmentCard({ appt, onEdit, onDelete }) {
  const d    = new Date(appt.appointment_date)
  const past = isPast(d) && !isToday(d)
  const dl   = dateLabel(appt.appointment_date)
  const stat = STATUS_CONFIG[appt.payment_status] || STATUS_CONFIG.pending

  return (
    <div className={`card relative overflow-hidden transition-all hover:shadow-md ${past ? 'opacity-60' : ''}`}>
      {/* Colour accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
           style={{ background: 'var(--c-primary)' }} />

      <div className="pl-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-body text-sm leading-tight">{appt.client_name}</p>
            {appt.client_phone && (
              <a href={`tel:${appt.client_phone}`}
                 className="text-xs text-faint flex items-center gap-1 mt-0.5 hover:text-primary transition-colors">
                <Phone size={10} /> {appt.client_phone}
              </a>
            )}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.css}`}>
            {stat.emoji} {stat.label}
          </span>
        </div>

        {/* Service */}
        <p className="text-primary text-sm font-medium mb-2">
          {appt.service_name}
          {appt.service_price && <span className="text-faint font-normal ml-1">— €{appt.service_price}</span>}
        </p>

        {/* Date/time */}
        <div className="flex items-center gap-1 text-xs text-muted mb-1">
          <Clock size={11} />
          <span className={dl.highlight ? 'font-semibold text-primary' : ''}>{dl.label}</span>
          <span>·</span>
          <span>{format(d, 'HH:mm')}</span>
        </div>

        {/* Notes */}
        {appt.notes && (
          <p className="text-xs text-faint italic mt-1 truncate">{appt.notes}</p>
        )}

        {/* Advance info */}
        {appt.payment_status === 'advance' && appt.advance_amount && (
          <p className="text-xs mt-1" style={{ color: 'var(--c-warning)' }}>
            💰 Anticipo: €{appt.advance_amount}
            {appt.service_price && (
              <> — Residuo: €{Math.max(0, Number(appt.service_price) - Number(appt.advance_amount)).toFixed(2)}</>
            )}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-theme">
          {appt.client_phone && (
            <button
              onClick={() => sendWhatsAppReminder(appt)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-surface-2"
              style={{ color: '#25d366' }}
              title="Invia promemoria WhatsApp"
            >
              <MessageCircle size={13} /> WhatsApp
            </button>
          )}
          <div className="ml-auto flex gap-1">
            <button onClick={() => onEdit(appt)}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-muted hover:text-primary">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(appt.id)}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-muted"
              style={{ '--hover': 'var(--c-danger)' }}
              onMouseOver={(e) => e.currentTarget.style.color='var(--c-danger)'}
              onMouseOut={(e) => e.currentTarget.style.color=''}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
