import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const { signIn, signUp, signInAsGuest } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (mode === 'login') await signIn(email, password)
      else await signUp(email, password, username || email.split('@')[0])
      nav('/', { replace: true })
    } catch (err) { setError(err.message || String(err)) }
    finally { setBusy(false) }
  }

  async function onGuest() {
    setBusy(true); setError(null)
    try { await signInAsGuest(); nav('/', { replace: true }) }
    catch (err) { setError(err.message || String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="mobile-frame min-h-screen flex flex-col justify-center px-6 py-md relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid pointer-events-none" />
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-h1 text-h1 text-primary-container tracking-[0.2em] drop-shadow-[0_0_30px_rgba(216,207,188,0.15)]">SIDELINE</h1>
          <p className="font-label-caps text-label-caps text-outline mt-2 tracking-widest">SECOND-SCREEN COMPANION · BUNDESLIGA</p>
        </div>

        <div className="bg-surface-container-low rounded-2xl border border-[#565449] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex border border-[#565449] rounded-full p-1 mb-6 bg-surface relative">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-center font-label-caps text-label-caps uppercase tracking-widest rounded-full transition-colors ${mode === 'login' ? 'bg-primary-container text-background shadow-[0_0_15px_rgba(216,207,188,0.2)]' : 'text-outline'}`}
            >Login</button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-center font-label-caps text-label-caps uppercase tracking-widest rounded-full transition-colors ${mode === 'signup' ? 'bg-primary-container text-background shadow-[0_0_15px_rgba(216,207,188,0.2)]' : 'text-outline'}`}
            >Sign Up</button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <Field label="OPERATIVE NAME" icon="badge">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="callsign"
                       className="w-full bg-background border border-[#565449] rounded-DEFAULT p-3 text-on-background placeholder-outline-variant focus:outline-none focus:border-primary-container" />
              </Field>
            )}
            <Field label="EMAIL" icon="mail">
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="user@sideline.pro"
                     className="w-full bg-background border border-[#565449] rounded-DEFAULT p-3 text-on-background placeholder-outline-variant focus:outline-none focus:border-primary-container" />
            </Field>
            <Field label="ACCESS CODE" icon="lock">
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                       type={showPw ? 'text' : 'password'} placeholder="••••••••"
                       className="w-full bg-background border border-[#565449] rounded-DEFAULT p-3 pr-10 text-on-background placeholder-outline-variant focus:outline-none focus:border-primary-container" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                  <span className="material-symbols-outlined text-[18px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </Field>

            {error && <div className="text-error text-sm">{error}</div>}

            <button disabled={busy} type="submit"
              className="w-full bg-primary-container text-background font-label-caps text-label-caps py-3 rounded-full uppercase tracking-widest hover:bg-primary transition-all hover:shadow-[0_0_20px_rgba(216,207,188,0.4)] flex justify-center items-center gap-2 disabled:opacity-50">
              {busy ? 'AUTHENTICATING…' : (mode === 'login' ? 'INITIALIZE' : 'CREATE OPERATIVE')}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#565449]" /></div>
              <div className="relative flex justify-center"><span className="bg-surface-container-low px-2 font-label-caps text-label-caps text-outline">OR</span></div>
            </div>

            <button type="button" onClick={onGuest} disabled={busy}
              className="w-full border border-[#565449] bg-background text-on-background hover:border-primary-container hover:text-primary-container font-label-caps text-label-caps py-3 rounded-full transition-all flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              CONTINUE AS GUEST
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-label-caps text-label-caps text-outline-variant flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">encrypted</span> SECURE CONNECTION
        </p>
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2">
      <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px] text-outline">{icon}</span>{label}
      </label>
      {children}
    </div>
  )
}
