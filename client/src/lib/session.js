const KEY = 'sideline.guest.session'
const TTL_MS = 2 * 60 * 60 * 1000

export function saveGuestSession(user) {
  const record = { user, expires_at: Date.now() + TTL_MS }
  localStorage.setItem(KEY, JSON.stringify(record))
  return record
}

export function loadGuestSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const record = JSON.parse(raw)
    if (!record?.expires_at || Date.now() > record.expires_at) {
      localStorage.removeItem(KEY)
      return null
    }
    return record
  } catch {
    localStorage.removeItem(KEY)
    return null
  }
}

export function clearGuestSession() {
  localStorage.removeItem(KEY)
}
