import { useEffect } from 'react'

// ── Modal wrapper ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  // Blocca lo scroll dello sfondo mentre il modale è aperto (necessario
  // perché su iOS lo scroll del body sotto un elemento "fixed" può
  // interferire con lo scroll interno del modale).
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-surface w-full ${maxWidth} rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto animate-slide-up`}
        style={{
          // dvh invece di vh: su iOS Safari 92vh viene calcolato includendo
          // l'area coperta dalla barra degli indirizzi, facendo "credere" al
          // modale che tutto il contenuto entri, mentre in realtà una parte
          // è tagliata fuori e irraggiungibile. dvh usa l'altezza visibile reale.
          maxHeight: '92dvh',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          // evita che il pulsante Salva finisca sotto l'home indicator su iPhone
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Modal header ──────────────────────────────────────────────────────────
export function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-theme sticky top-0 bg-surface z-10">
      <h2 className="font-display text-lg font-semibold text-body">{title}</h2>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-surface-2 transition-colors text-muted"
        aria-label="Chiudi"
      >
        ✕
      </button>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    neutral: 'badge-neutral',
  }
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  const variants = {
    primary: 'btn-primary shadow-sm',
    ghost:   'hover:bg-surface-2 text-muted',
    outline: 'border border-theme hover:bg-surface-2 text-body',
    danger:  'text-white',
  }
  const dangerStyle = variant === 'danger' ? { background: 'var(--c-danger)' } : {}
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={dangerStyle}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ color: 'var(--c-primary)' }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
    </svg>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="font-medium text-body text-sm">{title}</p>
      {subtitle && <p className="text-faint text-xs max-w-xs">{subtitle}</p>}
      {action && onAction && (
        <Button onClick={onAction} className="mt-1">{action}</Button>
      )}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-body">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
