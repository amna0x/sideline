import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.js'
import { forgotPassword, confirmForgotPassword, getOAuthUrl } from '../lib/cognito.js'

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

  function friendlyError(err) {
    const msg = err?.message || String(err)
    if (msg.includes('UsernameExistsException') || msg.includes('already exists')) {
      return 'An account with this email already exists. Try logging in instead.'
    }
    if (msg.includes('InvalidPasswordException')) {
      return 'Password must be at least 8 characters.'
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

  function onSocialLogin(provider) {
    const url = getOAuthUrl(provider)
    if (!url) {
      setError('Social login not configured. Add VITE_COGNITO_HOSTED_DOMAIN to .env')
      return
    }
    window.location.href = url
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

          {/* Mode header for non-tabbed modes */}
          {mode !== 'login' && mode !== 'signup' && (
            <div className="mb-5 flex items-center gap-2">
              <button type="button" onClick={() => { setMode('login'); setError(null); setCode(''); setPassword('') }}
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
              <Field label="EMAIL" icon="mail">
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="user@sideline.pro"
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

                {/* Social logins */}
                <div className="grid grid-cols-3 gap-2">
                  <SocialButton provider="Google" icon="google" onClick={() => onSocialLogin('Google')} />
                  <SocialButton provider="Apple" icon="apple" onClick={() => onSocialLogin('SignInWithApple')} />
                  <SocialButton provider="GitHub" icon="github" onClick={() => onSocialLogin('GitHub')} />
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

function SocialButton({ provider, icon, onClick }) {
  // Use SVG icons for the social brands (Material doesn't have them by default)
  const icons = {
    google: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    apple: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
    github: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    )
  }
  return (
    <button type="button" onClick={onClick}
      className="flex items-center justify-center gap-1 py-2.5 px-2 border border-[#e0e0e0] bg-white rounded-xl hover:border-[var(--sv-accent)] hover:bg-[#f8f8f8] transition-colors">
      {icons[icon]}
      <span className="text-xs font-comic text-[#666]">{provider}</span>
    </button>
  )
}
