// Socket.io event registration + helper emitters consumed by the simulator/engine.
// Authentication uses AWS Cognito JWTs (or guest userId in memory mode).

import { verifyToken, cognitoReady } from '../middleware/cognito.js'

async function authenticateSocket(socket) {
  const auth = socket.handshake.auth || {}
  if (cognitoReady && auth.token) {
    const user = await verifyToken(auth.token)
    if (user) {
      return {
        id: user.id,
        email: user.email,
        username: user.username || (user.email ? user.email.split('@')[0] : 'User'),
        avatar_url: user.metadata?.avatar_url || null
      }
    }
    // Cognito configured but token invalid — reject
    return null
  }
  if (!cognitoReady && auth.userId) {
    // Local dev only — guest mode
    const id = String(auth.userId)
    return {
      id,
      guest: true,
      username: auth.username || `Guest_${id.slice(0, 4)}`,
      avatar_url: null
    }
  }
  return null
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

    socket.on('match:leave', (matchId) => {
      if (typeof matchId === 'string') socket.leave(`match:${matchId}`)
    })

    socket.on('disconnect', () => console.log(`[socket] - ${socket.id}`))
  })
}

function room(matchId) { return matchId ? `match:${matchId}` : null }

export const emit = {
  matchUpdate: (io, matchId, payload) => {
    const r = room(matchId)
    r ? io.to(r).emit('match:update', payload) : io.emit('match:update', payload)
  },
  matchEvent: (io, matchId, ev) => {
    const r = room(matchId)
    r ? io.to(r).emit('match:event', ev) : io.emit('match:event', ev)
  },
  matchPulse: (io, matchId, zones) => {
    const r = room(matchId)
    r ? io.to(r).emit('match:pulse', zones) : io.emit('match:pulse', zones)
  },
  matchGoal: (io, drop) => io.emit('match:goal', drop),
  predictionNew: (io, p) => {
    const r = room(p?.match_id)
    r ? io.to(r).emit('prediction:new', p) : io.emit('prediction:new', p)
  },
  predictionResolved: (io, payload) => io.emit('prediction:resolved', payload),
  leaderboardUpdate: (io) => io.emit('leaderboard:update'),
  vaultMinted: (io, record) => io.emit('vault:minted', record),
  vaultSupply: (io, payload) => io.emit('vault:supply_update', payload)
}

export function emitToUser(io, userId, event, payload) {
  if (!userId) return
  io.to(`user:${userId}`).emit(event, payload)
}
