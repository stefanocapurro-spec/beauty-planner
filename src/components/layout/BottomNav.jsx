import { Calendar, Sparkles, CreditCard, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'appointments', icon: Calendar,   label: 'Agenda'       },
  { id: 'services',     icon: Sparkles,   label: 'Listino'      },
  { id: 'payments',     icon: CreditCard, label: 'Pagamenti'    },
  { id: 'settings',     icon: Settings,   label: 'Impostazioni' },
]

export function BottomNav({ current, onChange }) {
  return (
    <nav
      className="flex items-stretch border-t border-theme bg-surface flex-shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const active = current === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all active:scale-95 ${
              active ? 'text-primary' : 'text-faint'
            }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            {/* Pill indicator */}
            <div className="relative flex items-center justify-center">
              {active && (
                <span
                  className="absolute inset-0 rounded-xl opacity-20"
                  style={{ background: 'var(--c-primary)', transform: 'scale(1.4)' }}
                />
              )}
              <div className={`relative z-10 p-1.5 rounded-xl transition-all ${active ? 'bg-surface-2' : ''}`}>
                <Icon
                  size={active ? 22 : 20}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>
            </div>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
