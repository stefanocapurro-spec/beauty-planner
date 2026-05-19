import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Sparkles, Mail, Lock, UserPlus, LogIn } from 'lucide-react'

function InputField({ label, type, value, onChange, icon: Icon, autoComplete }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-muted">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint">
          <Icon size={16} />
        </span>
        <input
          className="input-base pl-9 pr-10"
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode,    setMode]    = useState('login') // 'login' | 'register' | 'reset'
  const [email,   setEmail]   = useState('')
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy,    setBusy]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Bentornata! ✨')
      } else if (mode === 'register') {
        if (password !== confirm) {
          toast.error('Le password non coincidono')
          return
        }
        if (password.length < 8) {
          toast.error('La password deve essere di almeno 8 caratteri')
          return
        }
        await signUp(email, password)
        toast.success('Account creato! Benvenuta 🌸')
      } else {
        await resetPassword(email)
        toast.success('Se l\'email esiste riceverai il link di reset 📧')
        setMode('login')
      }
    } catch (err) {
      // Messaggi di errore in italiano
      const msg = err.message || ''
      if (msg.includes('Invalid credentials'))
        toast.error('Email o password non corretti')
      else if (msg.includes('already exists') || msg.includes('user_already_exists'))
        toast.error('Email già registrata — prova ad accedere')
      else if (msg.includes('Invalid password'))
        toast.error('Password troppo corta (minimo 8 caratteri)')
      else
        toast.error(msg || 'Errore, riprova')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      {/* Decorazioni sfondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, var(--c-accent), transparent)' }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, var(--c-primary), transparent)' }} />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
               style={{ background: 'var(--c-primary)' }}>
            <Sparkles size={30} color="white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-body">Beauty Planner</h1>
          <p className="text-muted text-sm mt-1">Il tuo assistente personale ✨</p>
        </div>

        <div className="card shadow-xl">
          <h2 className="font-display text-xl font-semibold text-body mb-6 text-center">
            {mode === 'login'    && 'Accedi'}
            {mode === 'register' && 'Crea account'}
            {mode === 'reset'    && 'Reset password'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={Mail}
              autoComplete="email"
            />

            {mode !== 'reset' && (
              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={e => setPass(e.target.value)}
                icon={Lock}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}

            {mode === 'register' && (
              <>
                <InputField
                  label="Conferma password"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  icon={Lock}
                  autoComplete="new-password"
                />
                <p className="text-xs text-faint -mt-2">
                  Minimo 8 caratteri
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary rounded-xl py-2.5 font-medium flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {busy ? (
                <span className="animate-pulse-soft">Attendere…</span>
              ) : (
                <>
                  {mode === 'login'    && <><LogIn size={16} />    Accedi</>}
                  {mode === 'register' && <><UserPlus size={16} /> Registrati</>}
                  {mode === 'reset'    && <><Mail size={16} />     Invia link</>}
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('register'); setPass(''); setConfirm('') }}
                  className="text-primary hover:underline">
                  Non hai un account? Registrati
                </button>
                <button onClick={() => setMode('reset')}
                  className="text-faint hover:text-muted text-xs">
                  Password dimenticata?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => { setMode('login'); setPass(''); setConfirm('') }}
                className="text-primary hover:underline">
                ← Torna al login
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-faint text-xs mt-6">
          Tutti i dati sono cifrati end-to-end 🔒
        </p>
      </div>
    </div>
  )
}
