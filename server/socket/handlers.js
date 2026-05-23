// Socket.io event registration + helper emitters consumed by the simulator/engine.

import { supabase, ready } from '../db/supabase.js'

async function authenticateSocket(socket) {
  const auth = socket.handshake.auth || {}
  if (!ready) {
    if (!auth.userId) return null
    const id = String(auth.userId)
    return { id, guest: true, username: auth.username || `Guest_${id.slice(0, 4)}`, avatar_url: null }
  }
  if (!auth.token) return null
  const { data, error } = await supabase.auth.getUser(auth.token)
  if (error || !data?.user) return null
  return {
    id: data.user.id,
    email: data.user.email,
    username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
    avatar_url: data.user.user_metadata?.avatar_url || null
  }
}

export function registerSocketHandlers(io) {
  io.on('connection', async (socket) => {
    const user = await authenticateSocket(socket)
    socket.data.user = user
    if (user?.id) socket.join(`user:${user.id}`)
    console.log(`[socket] + ${socket.id}${user?.id ? ` user=${user.id}` : ' (anon)'}`)

    socket.on('match:join', (matchId) => {
      if (typeof matchId === 'string' && matchId.length < 64) socket.join(`match:${matchId}`)
    })

    socket.on('disconnect', () => console.log(`[socket] - ${socket.id}`))
  })
}

export const emit = {
  matchUpdate: (io, _matchId, payload) => io.emit('match:update', payload),
  matchEvent: (io, _matchId, ev) => io.emit('match:event', ev),
  matchPulse: (io, _matchId, zones) => io.emit('match:pulse', zones),
  matchGoal: (io, drop) => io.emit('match:goal', drop),
  predictionNew: (io, p) => io.emit('prediction:new', p),
  predictionResolved: (io, payload) => io.emit('prediction:resolved', payload),
  leaderboardUpdate: (io) => io.emit('leaderboard:update'),
  vaultMinted: (io, record) => io.emit('vault:minted', record),
  vaultSupply: (io, payload) => io.emit('vault:supply_update', payload)
}

export function emitToUser(io, userId, event, payload) {
  if (!userId) return
  io.to(`user:${userId}`).emit(event, payload)
}
