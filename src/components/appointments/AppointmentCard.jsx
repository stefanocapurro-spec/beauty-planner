import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { it } from 'date-fns/locale'
import { Pencil, Trash2, MessageCircle, Clock, Phone, ChevronDown, ChevronUp,
         CalendarClock, CalendarX, CalendarCheck, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { sendWhatsAppReminder } from '../../lib/whatsapp'

const STATUS_CONFIG = {
  pending:  { label: 'Da pagare',  emoji: '⏳', css: 'badge-warning'  },
  paid:     { label: 'Pagato',     emoji: '✅', css: 'badge-success'  },
  deferred: { label: 'Rimandato',  emoji: '🔄', css: 'badge-neutral'  },
  advance:  { label: 'Anticipo',   emoji: '💰', css: 'badge-neutral'  },
  cancelled:{ label: 'Annullato',  emoji: '❌', css: 'badge-danger'   },
}

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))    return { label: 'Oggi',   highlight: true }
  if (isTomorrow(d)) return { label: 'Domani', highlight: true }
  return { label: format(d, 'EEE d MMM', { locale: it }), highlight: false }
}

export function AppointmentCard({ appt, onEdit, onDelete, onReschedule, onCancel, onMarkPaid }) {
  const [expanded, setExpanded] = useState(false)
  const d    = new Date(appt.appointment_date)
  const past = isPast(d) && !isToday(d)
  const dl   = dateLabel(appt.appointment_date)
  const stat = STATUS_CONFIG[appt.payment_status] || STATUS_CONFIG.pending
  const isCancelled = appt.payment_status === 'cancelled'

  return (
    <div className={`card relative overflow-hidden transition-all hover:shadow-md ${
      past ? 'opacity-70' : ''} ${isCancelled ? 'opacity-50' : ''}`}>
      {/* Accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
           style={{ background: isCancelled ? 'var(--c-text-3)' : 'var(--c-primary)' }} />

      <div className="pl-3">
        {/* Riga superiore */}
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
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${stat.css}`}>
            {stat.emoji} {stat.label}
          </span>
        </div>

        {/* Servizio */}
        <p className="text-primary text-sm font-medium mb-1">
          {appt.service_name}
          {appt.service_price && (
            <span className="text-faint font-normal ml-1">— €{appt.service_price}</span>
          )}
        </p>

        {/* Data/ora */}
        <div className="flex items-center gap-1 text-xs text-muted mb-1">
          <Clock size={11} />
          <span className={dl.highlight ? 'font-semibold text-primary' : ''}>{dl.label}</span>
          <span>·</span>
          <span>{format(d, 'HH:mm')}</span>
        </div>

        {/* Note */}
        {appt.notes && (
          <p className="text-xs text-faint italic truncate mb-1">{appt.notes}</p>
        )}

        {/* Anticipo */}
        {appt.payment_status === 'advance' && appt.advance_amount && (
          <p className="text-xs mb-1" style={{ color: 'var(--c-warning)' }}>
            💰 Anticipo: €{appt.advance_amount}
            {appt.service_price && (
              <> · Residuo: €{Math.max(0, Number(appt.service_price) - Number(appt.advance_amount)).toFixed(2)}</>
            )}
          </p>
        )}

        {/* Azioni principali */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-theme flex-wrap">
          {/* WhatsApp */}
          {appt.client_phone && !isCancelled && (
            <button onClick={() => sendWhatsAppReminder(appt)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors"
              style={{ color: '#25d366' }} title="Promemoria WhatsApp">
              <MessageCircle size={13} /> WA
            </button>
          )}

          {/* Espandi azioni */}
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors text-muted ml-auto">
            Azioni {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Azioni espanse */}
        {expanded && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 animate-fade-in">
            {/* Modifica */}
            {!isCancelled && (
              <button onClick={() => onEdit(appt)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border border-theme hover:bg-surface-2 transition-colors text-body">
                <Pencil size={13} className="text-primary" /> Modifica
              </button>
            )}

            {/* Anticipa / Posticipa */}
            {!isCancelled && (
              <button onClick={() => onReschedule(appt)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border border-theme hover:bg-surface-2 transition-colors text-body">
                <CalendarClock size={13} className="text-primary" /> Sposta data
              </button>
            )}

            {/* Segna come pagato */}
            {!isCancelled && appt.payment_status !== 'paid' && (
              <button onClick={() => onMarkPaid(appt)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border border-theme hover:bg-surface-2 transition-colors text-body">
                <CalendarCheck size={13} style={{ color: 'var(--c-success)' }} /> Segna pagato
              </button>
            )}

            {/* Annulla appuntamento */}
            {!isCancelled && (
              <button onClick={() => onCancel(appt)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border hover:bg-surface-2 transition-colors"
                style={{ borderColor: 'var(--c-warning)', color: 'var(--c-warning)' }}>
                <CalendarX size={13} /> Annulla appt.
              </button>
            )}

            {/* Elimina definitivamente */}
            <button onClick={() => onDelete(appt.id)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border hover:bg-surface-2 transition-colors col-span-2 justify-center"
              style={{ borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }}>
              <Trash2 size={13} /> Elimina definitivamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
