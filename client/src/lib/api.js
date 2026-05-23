import { supabase } from './supabase.js'
import { loadGuestSession } from './session.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function authHeader() {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (token) return { Authorization: `Bearer ${token}` }
  }
  // Memory/guest mode — send user ID via header
  const guest = loadGuestSession()
  if (guest?.user?.id) return { 'x-user-id': guest.user.id }
  return {}
}

async function request(path, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...(opts.headers || {})
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim())
  }
  if (res.status === 204) return null
  return res.json()
}

async function upload(path, formData) {
  const headers = { ...(await authHeader()) }
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim())
  }
  return res.json()
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  patch: (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (p) => request(p, { method: 'DELETE' }),

  // Matches
  liveMatch: () => request('/api/matches/live'),
  upcomingMatch: () => request('/api/matches/upcoming'),
  match: (id) => request(`/api/matches/${id}`),

  // Predictions
  activePredictions: (matchId) => request(`/api/predictions/active?match_id=${matchId}`),
  upcomingPredictions: (matchId) => request(`/api/predictions/upcoming/${matchId}`),
  submitPrediction: (body) => request('/api/predictions/submit', { method: 'POST', body: JSON.stringify(body) }),

  // Users
  user: (id) => request(`/api/users/${id}`),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  uploadAvatar: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return upload(`/api/users/${id}/avatar`, fd)
  },

  // Vault
  vaultItems: () => request('/api/vault/items'),
  userVault: (id) => request(`/api/vault/user/${id}`),
  redeem: (body) => request('/api/vault/redeem', { method: 'POST', body: JSON.stringify(body) }),

  // Leaderboard
  leaderboard: (scope, matchId) => {
    const q = matchId ? `?match_id=${matchId}` : ''
    return request(`/api/leaderboard/${scope}${q}`)
  },
  myRank: (userId, scope) => request(`/api/leaderboard/rank/${userId}/${scope}`),

  // Quiz
  quiz: (matchId) => request(`/api/quiz/${matchId}`),
  submitQuiz: (body) => request('/api/quiz/answer', { method: 'POST', body: JSON.stringify(body) })
}
