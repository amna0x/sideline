import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.js'
import { forgotPassword, confirmForgotPassword } from '../lib/cognito.js'

export default function Login() {
  const { signIn, signUp, signInAsGuest, confirmSignUp, resendConfirmation } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('login') // login | signup | confirm | forgot | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pendingSignup, setPendingSignup] = useState(null)

  const normalizedEmail = email.trim().toLowerCase()
  const pendingEmail = pendingSignup?.email?.trim().toLowerCase() || ''
  const showPendingNotice = mode === 'login' && pendingEmail && normalizedEmail && pendingEmail === normalizedEmail

  function friendlyError(err) {
    const msg = err?.message || String(err)
    if (msg.includes('UsernameExistsException') || msg.includes('already exists')) {
      return 'An account with this email already exists or is waiting for verification. Check your inbox and spam/junk folder, or use Resend Code.'
    }
    if (msg.includes('InvalidPasswordException')) {
      return 'Password must be at least 8 characters.'
    }
    if (msg.includes('UserNotConfirmedException') || msg.includes('User is not confirmed')) {
      return 'This email is not verified yet. Check your inbox and spam/junk folder for the code, or resend it below.'
    }
    if (msg.includes('NotAuthorizedException') || msg.includes('Incorrect username or password')) {
      return 'Wrong email or password.'
    }
    if (msg.includes('UserNotFoundException')) {
      return 'No account found with this email.'
    }
    if (msg.includes('CodeMismatchException')) {
      return 'Invalid verification code.'
    }
    if (msg.includes('ExpiredCodeException')) {
      return 'Code has expired — request a new one.'
    }
    return msg
  }

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (mode === 'login') {
        // Support login by username or email
        let loginEmail = email
        if (!email.includes('@')) {
          // Looks like a username — look up the email
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/users/lookup/email/${encodeURIComponent(email)}`)
            if (res.ok) {
              const data = await res.json()
              loginEmail = data.email
            }
          } catch {}
        }
        try {
          await signIn(loginEmail, password)
        } catch (err) {
          const msg = err?.message || String(err)
          if (msg.includes('UserNotConfirmedException') || msg.includes('User is not confirmed')) {
            const pending = { email: loginEmail, username: loginEmail.split('@')[0] }
            setPendingSignup(pending)
            setMode('confirm')
            setError('This email is not verified yet. Check your inbox and spam/junk folder for the code, or resend it below.')
            return
          }
          throw err
        }
        nav('/', { replace: true })
      } else if (mode === 'signup') {
        const result = await signUp(email, password, username || email.split('@')[0])
        if (result?.userConfirmed) {
          await signIn(email, password)
          nav('/', { replace: true })
        } else {
          const pending = { email, username: username || email.split('@')[0] }
          setPendingSignup(pending)
          setMode('confirm')
          setError('Check your inbox and spam/junk folder for the verification code.')
        }
      } else if (mode === 'confirm') {
        await confirmSignUp(email, code.trim())
        await signIn(email, password)
        nav('/', { replace: true })
      } else if (mode === 'forgot') {
        await forgotPassword(email)
        setMode('reset')
        setError('Check your email for the reset code')
      } else if (mode === 'reset') {
        await confirmForgotPassword(email, code.trim(), password)
        setMode('login')
        setError('Password reset! Please log in.')
        setPassword('')
        setCode('')
      }
    } catch (err) { setError(friendlyError(err)) }
    finally { setBusy(false) }
  }

  async function onGuest() {
    setBusy(true); setError(null)
    try { await signInAsGuest(); nav('/', { replace: true }) }
    catch (err) { setError(friendlyError(err)) }
    finally { setBusy(false) }
  }

  async function onResend() {
    setError(null)
    try { await resendConfirmation(email); setError('Code sent to your email') }
    catch (err) { setError(friendlyError(err)) }
  }

  async function onUseDifferentEmail() {
    setPendingSignup(null)
    setMode('signup')
    setEmail('')
    setUsername('')
    setPassword('')
    setCode('')
    setError(null)
  }

  const titles = {
    login: 'ENTER',
    signup: 'CREATE ACCOUNT',
    confirm: 'CONFIRM EMAIL',
    forgot: 'SEND RESET CODE',
    reset: 'RESET PASSWORD'
  }

  return (
    <div className="mobile-frame min-h-screen flex flex-col justify-center px-6 py-md relative overflow-hidden">
      <div className="relative z-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <h1 className="font-comic text-5xl text-[var(--sv-accent)] tracking-tight">SIDELINE</h1>
          <p className="font-comic text-xs text-[#999] mt-2 tracking-widest">SECOND-SCREEN COMPANION · BUNDESLIGA</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#e0e0e0] p-5 shadow-lg">

          {/* Tabs (only for login/signup) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex border border-[#e0e0e0] rounded-full p-1 mb-5 bg-[#f5f5f5]">
              <button onClick={() => { setMode('login'); setError(null) }}
                className={`flex-1 py-2.5 text-center font-comic text-sm rounded-full transition-all ${mode === 'login' ? 'bg-[var(--sv-accent)] text-white shadow-md' : 'text-[#999]'}`}>
                Login
              </button>
              <button onClick={() => { setMode('signup'); setError(null) }}
                className={`flex-1 py-2.5 text-center font-comic text-sm rounded-full transition-all ${mode === 'signup' ? 'bg-[var(--sv-accent)] text-white shadow-md' : 'text-[#999]'}`}>
                Sign Up
              </button>
            </div>
          )}

          {showPendingNotice && (
            <div className="mb-5 rounded-2xl border border-[#f2d9a6] bg-[#fff8e8] p-4">
              <p className="font-comic text-xs uppercase tracking-widest text-[#9a6a00]">Verification pending</p>
              <p className="mt-1 text-sm text-[#5f4a18]">
                We already created an account for <span className="font-semibold">{pendingSignup.email}</span>. Please check your inbox and spam/junk folder for the code.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setMode('confirm')} className="px-3 py-2 rounded-full bg-[var(--sv-accent)] text-white text-xs font-comic">
                  Continue verification
                </button>
                <button type="button" onClick={onUseDifferentEmail} className="px-3 py-2 rounded-full border border-[#e0c98d] text-xs font-comic text-[#7a5a12]">
                  Use a different email
                </button>
              </div>
            </div>
          )}

          {/* Mode header for non-tabbed modes */}
          {mode !== 'login' && mode !== 'signup' && (
            <div className="mb-5 flex items-center gap-2">
              <button type="button" onClick={() => {
                if (mode === 'confirm') {
                  setMode('signup')
                } else {
                  setMode('login')
                }
                setError(null)
                setCode('')
              }}
                className="text-[#666] hover:text-[#1a1a1a] -ml-1">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="font-comic text-base text-[#1a1a1a]">
                {mode === 'confirm' ? 'Verify your email' : mode === 'forgot' ? 'Forgot password?' : 'Set new password'}
              </h2>
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <Field label="USERNAME" icon="badge">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your name"
                  className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
              </Field>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
              <Field label={mode === 'login' ? 'EMAIL OR USERNAME' : 'EMAIL'} icon="mail">
                <input value={email} onChange={(e) => {
                  const next = e.target.value
                  setEmail(next)
                  if (pendingSignup?.email && pendingSignup.email.trim().toLowerCase() !== next.trim().toLowerCase()) {
                    setPendingSignup(null)
                  }
                }} required type={mode === 'login' ? 'text' : 'email'}
                  placeholder={mode === 'login' ? 'email or username' : 'user@sideline.pro'}
                  disabled={mode === 'reset'}
                  className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors disabled:opacity-60" />
              </Field>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <Field label={mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'} icon="lock">
                <div className="relative">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 pr-10 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]">
                    <span className="material-symbols-outlined text-[18px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(null) }} className="text-xs font-comic text-[var(--sv-accent)] mt-2 self-end ml-auto block">
                    Forgot password?
                  </button>
                )}
              </Field>
            )}

            {(mode === 'confirm' || mode === 'reset') && (
              <Field label={mode === 'reset' ? 'RESET CODE' : 'CONFIRMATION CODE'} icon="mark_email_read">
                <input value={code} onChange={(e) => setCode(e.target.value)} required pattern="[0-9]{6}" placeholder="123456"
                  className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl p-3 text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[var(--sv-accent)] transition-colors tracking-widest text-center font-comic" />
                {mode === 'confirm' && (
                  <p className="text-xs text-[#777] leading-relaxed">
                    Check your inbox and spam/junk folders. If the code expired or never arrived, resend it from here.
                  </p>
                )}
                {mode === 'confirm' && (
                  <button type="button" onClick={onResend} className="text-xs font-comic text-[var(--sv-accent)] mt-2">RESEND CODE</button>
                )}
              </Field>
            )}

            {error && <div className={`text-sm font-medium ${error.includes('Check') || error.includes('reset!') || error.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>{error}</div>}

            <motion.button whileTap={{ scale: 0.97 }} disabled={busy} type="submit"
              className="w-full bg-[var(--sv-accent)] text-white font-comic text-base py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
              {busy ? 'WORKING…' : titles[mode]}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </motion.button>

            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e0e0e0]" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#999] font-comic">OR</span></div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onGuest} disabled={busy}
                  className="w-full border border-[#e0e0e0] bg-white text-[#666] hover:text-[#1a1a1a] hover:border-[var(--sv-accent)] font-comic text-sm py-3 rounded-xl transition-all flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  CONTINUE AS GUEST
                </motion.button>
                {mode === 'login' && (
                  <p className="text-[10px] text-[#999] text-center">Guest mode: limited features (no predictions, vault, friends)</p>
                )}
              </>
            )}
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
