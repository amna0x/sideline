import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const { signIn, signUp, signInAsGuest, confirmSignUp, resendConfirmation } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        nav('/', { replace: true })
      } else if (mode === 'signup') {
        const result = await signUp(email, password, username || email.split('@')[0])
        if (result?.userConfirmed) {
          await signIn(email, password)
          nav('/', { replace: true })
        } else {
          setMode('confirm')
        }
      } else if (mode === 'confirm') {
        await confirmSignUp(email, code.trim())
        await signIn(email, password)
        nav('/', { replace: true })
      }
    } catch (err) { setError(err.message || String(err)) }
    finally { setBusy(false) }
  }

  async function onGuest() {
    setBusy(true); setError(null)
    try { await signInAsGuest(); nav('/', { replace: true }) }
    catch (err) { setError(err.message || String(err)) }
    finally { setBusy(false) }
  }

  async function onResend() {
    setError(null)
    try { await resendConfirmation(email); setError('Code sent') }
    catch (err) { setError(err.message || String(err)) }
  }

  return (
    <div className="mobile-frame min-h-screen flex flex-col justify-center px-6 py-md relative overflow-hidden">
      <div className="relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="font-comic text-5xl text-[var(--sv-accent)] tracking-tight">SIDELINE</h1>
          <p className="font-comic text-xs text-[#999] mt-2 tracking-widest">SECOND-SCREEN COMPANION · BUNDESLIGA</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#e0e0e0] p-5 shadow-lg"
        >
          <div className="flex border border-[#e0e0e0] rounded-full p-1 mb-6 bg-[#f5f5f5]">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-center font-comic text-sm rounded-full transition-all ${mode === 'login' ? 'bg-[var(--sv-accent)] text-white shadow-md' : 'text-[#999]'}`}
            >Login</button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-center font-comic text-sm rounded-full transition-all ${mode === 'signup' ? 'bg-[var(--sv-accent)] text-white shadow-md' : 'text-[#999]'}`}
            >Sign Up</button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <Field label="USERNAME" icon="badge">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your name"
                       className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
              </Field>
            )}
            {mode !== 'confirm' && (
              <>
                <Field label="EMAIL" icon="mail">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="user@sideline.pro"
                         className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
                </Field>
                <Field label="PASSWORD" icon="lock">
                  <div className="relative">
                    <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                           type={showPw ? 'text' : 'password'} placeholder="••••••••"
                           className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 pr-10 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]">
                      <span className="material-symbols-outlined text-[18px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </Field>
              </>
            )}
            {mode === 'confirm' && (
              <Field label="CONFIRMATION CODE" icon="mark_email_read">
                <input value={code} onChange={(e) => setCode(e.target.value)} required pattern="[0-9]{6}" placeholder="123456"
                       className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors tracking-widest text-center font-comic" />
                <button type="button" onClick={onResend} className="text-xs font-comic text-[var(--sv-accent)] mt-2">RESEND CODE</button>
              </Field>
            )}

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              type="submit"
              className="w-full bg-[var(--sv-accent)] text-white font-comic text-base py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {busy ? 'CONNECTING…' : (mode === 'login' ? 'ENTER' : mode === 'signup' ? 'CREATE ACCOUNT' : 'CONFIRM EMAIL')}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </motion.button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e0e0e0]" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#999] font-comic">OR</span></div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onGuest}
              disabled={busy}
              className="w-full border border-[#e0e0e0] bg-white text-[#666] hover:text-[#1a1a1a] hover:border-[var(--sv-accent)] font-comic text-sm py-3 rounded-xl transition-all flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              CONTINUE AS GUEST
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center mt-6 text-xs text-[#bbb] flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">encrypted</span> SECURE CONNECTION
        </p>
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2">
      <label className="font-comic text-[11px] text-[#999] flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px] text-[#bbb]">{icon}</span>{label}
      </label>
      {children}
    </div>
  )
}
