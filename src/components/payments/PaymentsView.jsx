import { useMemo, useState } from 'react'
import { CreditCard, TrendingUp, CheckCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAllPayments } from '../../hooks/usePayments'
import { EmptyState } from '../ui'

const TYPE_CONFIG = {
  paid:        { label: 'Pagato',        Icon: CheckCircle, color: 'var(--c-success)' },
  deferred:    { label: 'Rimandato',     Icon: RotateCcw,   color: 'var(--c-warning)' },
  advance:     { label: 'Anticipo',      Icon: TrendingUp,  color: 'var(--c-primary)' },
  used_credit: { label: 'Credito usato', Icon: CreditCard,  color: 'var(--c-text-3)'  },
}

export function PaymentsView() {
  const { payments, loading } = useAllPayments()
  const [expandMonth, setExpandMonth] = useState(null)

  // Totali aggregati
  const { totPaid, totDeferred, creditBal } = useMemo(() => {
    const totPaid     = payments.filter(p => p.type === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0)
    const totDeferred = payments.filter(p => p.type === 'deferred').reduce((s, p) => s + Number(p.amount || 0), 0)
    const advance     = payments.filter(p => p.type === 'advance').reduce((s, p) => s + Number(p.amount || 0), 0)
    const used        = payments.filter(p => p.type === 'used_credit').reduce((s, p) => s + Number(p.amount || 0), 0)
    return { totPaid, totDeferred, creditBal: Math.max(0, advance - used) }
  }, [payments])

  // Raggruppa per mese
  const byMonth = useMemo(() => {
    return payments.reduce((acc, p) => {
      const key = format(new Date(p.created_at || Date.now()), 'MMMM yyyy', { locale: it })
      ;(acc[key] = acc[key] || []).push(p)
      return acc
    }, {})
  }, [payments])

  const stats = [
    { label: 'Incassato',      amount: totPaid,     color: 'var(--c-success)', emoji: '✅' },
    { label: 'Da riscuotere',  amount: totDeferred,  color: 'var(--c-warning)', emoji: '⏳' },
    { label: 'Credito clienti',amount: creditBal,    color: 'var(--c-primary)', emoji: '💰' },
  ]

  return (
    <div className="flex flex-col h-full">
      <h1 className="font-display text-2xl font-bold text-body mb-5">Pagamenti</h1>

      {/* Statistiche */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map(s => (
          <div key={s.label} className="card text-center p-3">
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className="font-display text-base font-bold" style={{ color: s.color }}>
              €{s.amount.toFixed(2)}
            </p>
            <p className="text-[10px] text-faint mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Banner credito */}
      {creditBal > 0 && (
        <div className="rounded-xl p-3 mb-4 border flex items-center gap-3 animate-fade-in"
             style={{ borderColor: 'var(--c-primary)', background: 'var(--c-surface-2)' }}>
          <span className="text-2xl">💳</span>
          <div>
            <p className="text-sm font-semibold text-body">Credito disponibile: €{creditBal.toFixed(2)}</p>
            <p className="text-xs text-muted">Da scalare sul prossimo appuntamento</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted animate-pulse-soft">Caricamento…</p>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState emoji="💳" title="Nessun pagamento registrato"
          subtitle="I pagamenti vengono aggiunti tramite gli appuntamenti" />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-6">
          {Object.entries(byMonth).map(([month, rows]) => {
            const monthTotal = rows.filter(r => r.type === 'paid').reduce((s, r) => s + Number(r.amount || 0), 0)
            const isOpen = expandMonth === month
            return (
              <div key={month} className="card overflow-hidden p-0">
                <button
                  onClick={() => setExpandMonth(isOpen ? null : month)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold text-body capitalize">{month}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full badge-neutral">
                      {rows.length} operazioni
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">€{monthTotal.toFixed(2)}</span>
                    {isOpen
                      ? <ChevronUp size={16} className="text-faint" />
                      : <ChevronDown size={16} className="text-faint" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-theme divide-y divide-[var(--c-border)]">
                    {rows.map(p => {
                      const cfg = TYPE_CONFIG[p.type] || TYPE_CONFIG.paid
                      const { Icon } = cfg
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                               style={{ background: cfg.color + '22' }}>
                            <Icon size={14} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-body truncate">
                              {p.client_name || '—'}
                            </p>
                            <p className="text-xs text-faint truncate">
                              {p.service_name || p.notes || '—'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                              €{Number(p.amount || 0).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-faint">{cfg.label}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
