import { useEffect } from 'react'
import { useSocket } from './useSocket.js'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'
import { saveGuestSession, loadGuestSession, clearGuestSession } from '../lib/session.js'
import { reconnectSocket } from '../lib/socket.js'
import { loadThemeFromProfile, applyTheme } from '../lib/theme.js'
import {
  cognitoReady,
  signIn as cogSignIn,
  signUp as cogSignUp,
  confirmSignUp as cogConfirm,
  resendConfirmation as cogResend,
  signOut as cogSignOut,
  getCurrentSession
} from '../lib/cognito.js'

export function useAuth() {
  const setSession = useStore((s) => s.setSession)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const setPoints = useStore((s) => s.setPoints)
  const clearAuth = useStore((s) => s.clearAuth)
  const session = useStore((s) => s.session)
  const user = useStore((s) => s.user)
  const isGuest = useStore((s) => s.isGuest)

  useEffect(() => {
    if (!cognitoReady) {
      const cached = loadGuestSession()
      if (cached?.user) {
        setSession({ user: cached.user })
        useStore.getState().setGuest(true)
      } else {
        setSession(null)
      }
      return
    }
    getCurrentSession().then((s) => {
      if (s?.user) {
        setSession(s)
        useStore.getState().setGuest(false)
      } else {
        const cached = loadGuestSession()
        if (cached?.user) {
          setSession({ user: cached.user })
          useStore.getState().setGuest(true)
        } else {
          setSession(null)
        }
      }
    })
  }, [setSession])

  useEffect(() => {
    if (!user?.id) return
    api.user(user.id).then((profile) => {
      setUserProfile(profile)
      if (profile?.points_total != null) setPoints(profile.points_total)
      // Sync theme from profile (account-level persistence)
      const profileTheme = loadThemeFromProfile(profile)
      if (profileTheme) {
        applyTheme(profileTheme)
        useStore.getState().setTheme(profileTheme)
      }
    }).catch(() => {})
  }, [user?.id, setUserProfile, setPoints])

  // Listen for server-side point updates over socket and sync profile+points
  useSocket({
    'user:points_updated': ({ userId, points_total }) => {
      const curUser = useStore.getState().user
      if (curUser?.id === userId) {
        useStore.getState().setPoints(points_total)
        // also update profile object if present
        const profile = useStore.getState().user?.profile
        if (profile) useStore.getState().setUserProfile({ ...profile, points_total })
      }
    }
  })

  async function signIn(email, password) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    const result = await cogSignIn(email, password)
    setSession(result)
    useStore.getState().setGuest(false)
    reconnectSocket()
    return result
  }

  async function signUp(email, password, username) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    return cogSignUp(email, password, username)
  }

  async function confirmSignUp(email, code) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    // Use server-side confirm which also sets email_verified = true
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const res = await fetch(`${base}/api/auth/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const err = new Error(data.error || 'Confirmation failed')
      if (data.error === 'invalid_code') err.message = 'CodeMismatchException'
      if (data.error === 'expired_code') err.message = 'ExpiredCodeException'
      throw err
    }
    return await res.json()
  }

  async function resendConfirmation(email) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    return cogResend(email)
  }

  async function signInAsGuest() {
    const guest = {
      id: `guest_${Math.random().toString(36).slice(2, 10)}`,
      email: 'guest@sideline.local',
      user_metadata: { username: 'Guest' }
    }
    saveGuestSession(guest)
    useStore.getState().setSession({ user: guest })
    useStore.getState().setGuest(true)
    return { user: guest }
  }

  async function signOut() {
    if (cognitoReady) cogSignOut()
    clearGuestSession()
    clearAuth()
    reconnectSocket()
  }

  return { session, user, isGuest, signIn, signUp, confirmSignUp, resendConfirmation, signInAsGuest, signOut }
}
