import { useEffect } from 'react'
import { supabase, supabaseReady } from '../lib/supabase.js'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'
import { saveGuestSession, loadGuestSession, clearGuestSession } from '../lib/session.js'

export function useAuth() {
  const setSession = useStore((s) => s.setSession)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const setPoints = useStore((s) => s.setPoints)
  const clearAuth = useStore((s) => s.clearAuth)
  const session = useStore((s) => s.session)
  const user = useStore((s) => s.user)
  const isGuest = useStore((s) => s.isGuest)

  useEffect(() => {
    if (!supabaseReady) {
      const cached = loadGuestSession()
      if (cached?.user) {
        setSession({ user: cached.user })
        useStore.getState().setGuest(true)
      } else {
        setSession(null)
      }
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess))
    return () => sub.subscription.unsubscribe()
  }, [setSession])

  useEffect(() => {
    if (!user?.id) return
    api.user(user.id).then((profile) => {
      setUserProfile(profile)
      if (profile?.points_total != null) setPoints(profile.points_total)
    }).catch(() => {})
  }, [user?.id, setUserProfile, setPoints])

  async function signIn(email, password) {
    if (!supabaseReady) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, username) {
    if (!supabaseReady) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { username } }
    })
    if (error) throw error
    return data
  }

  async function signInAsGuest() {
    if (!supabaseReady) {
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
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    useStore.getState().setGuest(true)
    return data
  }

  async function signOut() {
    if (supabaseReady) await supabase.auth.signOut()
    clearGuestSession()
    clearAuth()
  }

  return { session, user, isGuest, signIn, signUp, signInAsGuest, signOut }
}
