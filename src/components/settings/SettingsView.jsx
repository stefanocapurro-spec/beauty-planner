import { useState } from 'react'
import { Sun, Moon, Monitor, LogOut, User, Palette, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { PALETTES, PALETTE_KEYS } from '../../styles/themes'
import toast from 'react-hot-toast'

const MODE_OPTIONS = [
  { value: 'light',  icon: Sun,     label: 'Chiaro' },
  { value: 'dark',   icon: Moon,    label: 'Scuro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
]

export function SettingsView({ onSuperAdmin }) {
  const { user, signOut, isSuperAdmin } = useAuth()
  const { palette, preference, changePalette, changeMode } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSignOut() {
    setLoggingOut(true)
    await signOut()
    toast.success('Arrivederci! 👋')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      <h1 className="font-display text-2xl font-bold text-body mb-5">Impostazioni</h1>

      {/* Account */}
      <section className="card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <User size={16} className="text-primary" />
          <h2 className="font-semibold text-body text-sm">Account</h2>
        </div>
        <p className="text-xs text-muted mb-1">Email</p>
        <p className="text-sm text-body font-medium mb-4">{user?.email}</p>
        <p className="text-xs text-faint flex items-center gap-1 mb-4">
          🔒 Tutti i dati sono cifrati end-to-end con AES-256-GCM
        </p>
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-sm transition-colors hover:bg-surface-2"
          style={{ borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }}
        >
          <LogOut size={15} /> Esci
        </button>
      </section>

      {/* Palette */}
      <section className="card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Palette size={16} className="text-primary" />
          <h2 className="font-semibold text-body text-sm">Tavolozza colori</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_KEYS.map((key) => {
            const p = PALETTES[key]
            const vars = p.light
            return (
              <button
                key={key}
                onClick={() => changePalette(key)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  palette === key ? 'border-[var(--c-primary)]' : 'border-theme hover:border-[var(--c-accent)]'
                }`}
              >
                {/* Color swatch */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {[vars['--c-primary'], vars['--c-accent'], vars['--c-surface-2']].map((c, i) => (
                    <div key={i} className="w-3 h-6 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-body">{p.label}</p>
                  <p className="text-lg leading-none">{p.emoji}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Mode */}
      <section className="card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Sun size={16} className="text-primary" />
          <h2 className="font-semibold text-body text-sm">Modalità schermo</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => changeMode(value)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                preference === value
                  ? 'border-[var(--c-primary)] bg-surface-2 text-primary'
                  : 'border-theme text-muted hover:border-[var(--c-accent)]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* SuperAdmin */}
      {isSuperAdmin && (
        <section className="card border-[var(--c-warning)]">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={16} style={{ color: 'var(--c-warning)' }} />
            <h2 className="font-semibold text-body text-sm">Superadmin</h2>
          </div>
          <button
            onClick={onSuperAdmin}
            className="w-full py-2.5 rounded-xl text-sm font-medium border-2 transition-colors hover:bg-surface-2"
            style={{ borderColor: 'var(--c-warning)', color: 'var(--c-warning)' }}
          >
            🛠 Pannello superadmin
          </button>
        </section>
      )}

      <p className="text-center text-faint text-xs mt-6">Beauty Planner v1.0 — Made with 💜</p>
    </div>
  )
}
