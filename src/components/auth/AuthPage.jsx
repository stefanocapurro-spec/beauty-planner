import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME, APP_ICON } from '../../lib/constants'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react'

function InputField({ label, type, value, onChange, icon: Icon, autoComplete }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted flex items-center gap-1.5">
        <Icon size={14} className="text-faint flex-shrink-0" />{label}
      </label>
      <div className="relative">
        <input
          className="input-base"
          style={{ paddingRight: isPassword ? '2.75rem' : undefined }}
          type={isPassword && show ? 'text' : type}
          value={value} onChange={onChange}
          autoComplete={autoComplete} required
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-xl p-3 text-sm"
         style={{ background: 'var(--c-danger)15', border: '1px solid var(--c-danger)', color: 'var(--c-danger)' }}>
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

function parseError(err) {
  const msg  = err?.message || ''
  const code = err?.code    || 0
  console.error('[Auth]', { code, msg })
  if (code === 0 || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network'))
    return 'Impossibile raggiungere il server. Controlla che il dominio sia autorizzato in Appwrite Console → Platforms.'
  if (code === 401 || msg.includes('Invalid credentials'))  return 'Email o password non corretti.'
  if (code === 409 || msg.includes('already exists'))       return 'Email già registrata — prova ad accedere.'
  if (msg.includes('password'))                             return 'Password troppo corta (minimo 8 caratteri).'
  if (code === 429)                                         return 'Troppi tentativi. Aspetta qualche minuto.'
  return msg || 'Errore sconosciuto. Controlla la console (F12).'
}

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode,     setMode]    = useState('login')
  const [email,    setEmail]   = useState('')
  const [password, setPass]    = useState('')
  const [confirm,  setConfirm] = useState('')
  const [busy,     setBusy]    = useState(false)
  const [error,    setError]   = useState('')

  function resetFields() { setPass(''); setConfirm(''); setError('') }
  function switchMode(m) { setMode(m); resetFields() }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'register') {
      if (password !== confirm) { setError('Le password non coincidono.'); return }
      if (password.length < 8)  { setError('La password deve essere di almeno 8 caratteri.'); return }
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Bentornata! ✨')
      } else if (mode === 'register') {
        await signUp(email, password)
        toast.success('Account creato! Benvenuta 🌸')
      } else {
        await resetPassword(email)
        toast.success('Link di reset inviato 📧')
        switchMode('login')
      }
    } catch (err) {
      setError(parseError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, var(--c-accent), transparent)' }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, var(--c-primary), transparent)' }} />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 shadow-xl overflow-hidden">
            <img src={APP_ICON} alt={APP_NAME} className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-3xl font-bold text-body">{APP_NAME}</h1>
          <p className="text-muted text-sm mt-1">Il tuo assistente personale ✨</p>
        </div>

        <div className="card shadow-xl">
          <h2 className="font-display text-xl font-semibold text-body mb-6 text-center">
            {mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Reset password'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} icon={Mail} autoComplete="email" />
            {mode !== 'reset' && (
              <InputField label="Password" type="password" value={password}
                onChange={e => setPass(e.target.value)} icon={Lock}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            )}
            {mode === 'register' && (
              <>
                <InputField label="Conferma password" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} icon={Lock} autoComplete="new-password" />
                <p className="text-xs text-faint -mt-1">Minimo 8 caratteri</p>
              </>
            )}
            <ErrorBox message={error} />
            <button type="submit" disabled={busy}
              className="btn-primary rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <span className="animate-pulse-soft">Attendere…</span> : (
                <>
                  {mode === 'login'    && <><LogIn    size={16} /> Accedi</>}
                  {mode === 'register' && <><UserPlus size={16} /> Registrati</>}
                  {mode === 'reset'    && <><Mail     size={16} /> Invia link</>}
                </>
              )}
            </button>
          </form>
          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => switchMode('register')} className="text-primary hover:underline">
                  Non hai un account? Registrati
                </button>
                <button onClick={() => switchMode('reset')} className="text-faint hover:text-muted text-xs">
                  Password dimenticata?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => switchMode('login')} className="text-primary hover:underline">
                ← Torna al login
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-faint text-xs mt-6">Tutti i dati sono cifrati end-to-end 🔒</p>
      </div>
    </div>
  )
}
