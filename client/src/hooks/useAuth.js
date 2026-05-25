import { useEffect } from 'react'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'
import { saveGuestSession, loadGuestSession, clearGuestSession } from '../lib/session.js'
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
    }).catch(() => {})
  }, [user?.id, setUserProfile, setPoints])

  async function signIn(email, password) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    const result = await cogSignIn(email, password)
    setSession(result)
    useStore.getState().setGuest(false)
    return result
  }

  async function signUp(email, password, username) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    return cogSignUp(email, password, username)
  }

  async function confirmSignUp(email, code) {
    if (!cognitoReady) throw new Error('AWS Cognito not configured')
    return cogConfirm(email, code)
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
  }

  return { session, user, isGuest, signIn, signUp, confirmSignUp, resendConfirmation, signInAsGuest, signOut }
}
