import { getIdToken } from './cognito.js'
import { loadGuestSession } from './session.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function authHeader() {
  const token = await getIdToken().catch(() => null)
  if (token) return { Authorization: `Bearer ${token}` }
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
  purchaseVault: (vaultItemId) => request('/api/vault/purchase', { method: 'POST', body: JSON.stringify({ vault_item_id: vaultItemId }) }),

  // Leaderboard
  leaderboard: (scope, matchId) => {
    const q = matchId ? `?match_id=${matchId}` : ''
    return request(`/api/leaderboard/${scope}${q}`)
  },
  myRank: (userId, scope) => request(`/api/leaderboard/rank/${userId}/${scope}`),

  // Quiz
  quiz: (matchId) => request(`/api/quiz/${matchId}`),
  submitQuiz: (body) => request('/api/quiz/answer', { method: 'POST', body: JSON.stringify(body) }),

  // Share
  shareCard: (body) => request('/api/share/card', { method: 'POST', body: JSON.stringify(body) }),

  // Friends
  friends: () => request('/api/friends'),
  friendRequests: () => request('/api/friends/requests'),
  outgoingRequests: () => request('/api/friends/requests/outgoing'),
  addFriend: (friendId) => request('/api/friends/add', { method: 'POST', body: JSON.stringify({ friend_id: friendId }) }),
  acceptFriend: (requestId) => request('/api/friends/accept', { method: 'POST', body: JSON.stringify({ request_id: requestId }) }),
  declineFriend: (requestId) => request('/api/friends/decline', { method: 'POST', body: JSON.stringify({ request_id: requestId }) }),
  removeFriend: (friendId) => request(`/api/friends/${friendId}`, { method: 'DELETE' }),
  searchUsers: (q) => request(`/api/friends/search?q=${encodeURIComponent(q)}`),
  devGrant: (body) => request('/api/dev/grant', { method: 'POST', body: JSON.stringify(body) }),

  // Squad
  squadInvite: (code) => request(`/api/squad/invite/${code}`),
  squadMessages: (squadId) => request(`/api/squad/${encodeURIComponent(squadId)}/messages`),

  // Cosmetics
  cosmetics: () => request('/api/cosmetics'),
  userCosmetics: (userId) => request(`/api/cosmetics/user/${userId}`),
  purchaseCosmetic: (cosmeticId) => request('/api/cosmetics/purchase', { method: 'POST', body: JSON.stringify({ cosmetic_id: cosmeticId }) }),
  equipCosmetic: (cosmeticId, equipped) => request('/api/cosmetics/equip', { method: 'POST', body: JSON.stringify({ cosmetic_id: cosmeticId, equipped }) }),
  hasGifUnlock: (userId) => request(`/api/cosmetics/has-gif/${userId}`),

  // Stickers (Stipop)
  stickerPacks: (page = 1) => request(`/api/stickers/packs?page=${page}`),
  stickerPackStickers: (packId) => request(`/api/stickers/packs/${packId}`),
  searchStickers: (q) => request(`/api/stickers/search?q=${encodeURIComponent(q)}`)
}
