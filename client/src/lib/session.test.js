import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveGuestSession, loadGuestSession, clearGuestSession } from './session.js'

describe('guest session', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a saved guest user', () => {
    const user = { id: 'guest_abc', email: 'g@local' }
    saveGuestSession(user)
    expect(loadGuestSession()?.user).toEqual(user)
  })

  it('returns null after TTL elapses', () => {
    saveGuestSession({ id: 'g1' })
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000)
    expect(loadGuestSession()).toBeNull()
    vi.useRealTimers()
  })

  it('clears on demand', () => {
    saveGuestSession({ id: 'g1' })
    clearGuestSession()
    expect(loadGuestSession()).toBeNull()
  })

  it('survives malformed storage', () => {
    localStorage.setItem('sideline.guest.session', '{broken')
    expect(loadGuestSession()).toBeNull()
  })
})
