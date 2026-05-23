import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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

      {/* Decorative splatter */}
      <div className="absolute top-20 -right-10 w-40 h-40 rounded-full bg-[var(--sv-accent)] opacity-[0.04] blur-3xl" />
      <div className="absolute bottom-32 -left-10 w-32 h-32 rounded-full bg-[var(--sv-cyan)] opacity-[0.03] blur-3xl" />

      <div className="relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="font-comic text-5xl text-[var(--sv-accent)] chromatic tracking-tight" data-text="SIDELINE">SIDELINE</h1>
          <p className="font-comic text-xs text-white/30 mt-2 tracking-widest">SECOND-SCREEN COMPANION · BUNDESLIGA</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="comic-panel p-5"
        >
          <div className="flex border border-white/10 rounded-full p-1 mb-6 bg-black/50">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-center font-comic text-sm rounded-full transition-all ${mode === 'login' ? 'bg-[var(--sv-accent)] text-black shadow-[0_0_12px_var(--sv-accent)]' : 'text-white/40'}`}
            >Login</button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-center font-comic text-sm rounded-full transition-all ${mode === 'signup' ? 'bg-[var(--sv-accent)] text-black shadow-[0_0_12px_var(--sv-accent)]' : 'text-white/40'}`}
            >Sign Up</button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <Field label="USERNAME" icon="badge">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your name"
                       className="w-full bg-black border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
              </Field>
            )}
            <Field label="EMAIL" icon="mail">
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="user@sideline.pro"
                     className="w-full bg-black border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
            </Field>
            <Field label="PASSWORD" icon="lock">
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                       type={showPw ? 'text' : 'password'} placeholder="••••••••"
                       className="w-full bg-black border border-white/10 rounded-xl p-3 pr-10 text-white placeholder-white/20 focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                  <span className="material-symbols-outlined text-[18px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </Field>

            {error && <div className="text-red-400 text-sm font-medium">{error}</div>}

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              type="submit"
              className="w-full bg-[var(--sv-accent)] text-black font-comic text-base py-3.5 rounded-xl shadow-[0_0_20px_var(--sv-accent)] hover:shadow-[0_0_30px_var(--sv-accent)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {busy ? 'CONNECTING…' : (mode === 'login' ? 'ENTER' : 'CREATE ACCOUNT')}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </motion.button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="bg-black px-3 text-xs text-white/20 font-comic">OR</span></div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onGuest}
              disabled={busy}
              className="w-full border border-white/10 bg-black text-white/60 hover:text-white hover:border-[var(--sv-cyan)] font-comic text-sm py-3 rounded-xl transition-all flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              CONTINUE AS GUEST
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center mt-6 text-xs text-white/20 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">encrypted</span> SECURE CONNECTION
        </p>
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2">
      <label className="font-comic text-[11px] text-white/40 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px] text-white/20">{icon}</span>{label}
      </label>
      {children}
    </div>
  )
}
