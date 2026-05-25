// Squad rooms, live reactions, chat, and head-to-head duels — all socket-driven.

import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'

const squads = new Map()  // squadId -> { id, name, matchId, inviteCode, members: Map<socketId, {userId, username, avatar_url, joinedAt}>, createdBy, createdAt }
const inviteCodes = new Map() // inviteCode -> squadId
const duels = []
const reactionCooldowns = new Map()

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function getSquadByInviteCode(code) {
  const squadId = inviteCodes.get(code?.toUpperCase())
  return squadId ? squads.get(squadId) : null
}

export function generateInviteCode(squadId) {
  const squad = squads.get(squadId)
  if (!squad) return null
  if (squad.inviteCode) return squad.inviteCode
  const code = genCode()
  squad.inviteCode = code
  inviteCodes.set(code, squadId)
  return code
}

export function registerSquadHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('squad:join', ({ squadName, matchId }) => {
      if (!squadName || !matchId) return
      const user = socket.data.user
      if (!user?.id) return socket.emit('squad:error', { message: 'auth required' })

      const squadId = `${matchId}::${squadName.toLowerCase().trim()}`
      let squad = squads.get(squadId)
      if (!squad) {
        const inviteCode = genCode()
        squad = {
          id: squadId,
          name: squadName.trim(),
          matchId,
          inviteCode,
          members: new Map(),
          createdBy: user.id,
          createdAt: Date.now()
        }
        squads.set(squadId, squad)
        inviteCodes.set(inviteCode, squadId)
      }

      // Leave any previous squad
      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          s.members.delete(socket.id)
          socket.leave(`squad:${sid}`)
          io.to(`squad:${sid}`).emit('squad:member_left', { userId: user.id, memberCount: s.members.size })
          if (s.members.size === 0) squads.delete(sid)
        }
      }

      const member = { userId: user.id, username: user.username || user.email || 'Anon', avatar_url: user.avatar_url || null, joinedAt: Date.now() }
      squad.members.set(socket.id, member)
      socket.join(`squad:${squadId}`)

      // Send full state to joiner
      socket.emit('squad:state', {
        id: squad.id,
        name: squad.name,
        matchId: squad.matchId,
        inviteCode: squad.inviteCode,
        members: [...squad.members.values()],
        memberCount: squad.members.size
      })

      // Broadcast to others
      socket.to(`squad:${squadId}`).emit('squad:member_joined', { ...member, memberCount: squad.members.size })
    })

    socket.on('squad:leave', () => {
      const user = socket.data.user
      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          s.members.delete(socket.id)
          socket.leave(`squad:${sid}`)
          io.to(`squad:${sid}`).emit('squad:member_left', { userId: user?.id, memberCount: s.members.size })
          if (s.members.size === 0) squads.delete(sid)
        }
      }
    })

    socket.on('squad:reaction', ({ emoji }) => {
      const user = socket.data.user
      if (!user?.id) return
      const allowed = ['⚽', '🔥', '😱', '👏', '💀']
      if (!allowed.includes(emoji)) return

      // Rate limit: 1 reaction per 500ms per socket
      const now = Date.now()
      const last = reactionCooldowns.get(socket.id) || 0
      if (now - last < 500) return
      reactionCooldowns.set(socket.id, now)

      // Find which squad this socket is in
      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          io.to(`squad:${sid}`).emit('squad:reaction_burst', {
            emoji,
            userId: user.id,
            username: user.username || user.email || 'Anon',
            ts: now
          })
          break
        }
      }
    })

    // Squad chat message
    socket.on('squad:message', async ({ text }) => {
      const user = socket.data.user
      if (!user?.id || !text || text.trim().length === 0) return
      const msg = text.trim().slice(0, 500) // max 500 chars

      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          const chatMsg = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            squad_id: sid,
            user_id: user.id,
            username: user.username || 'Anon',
            avatar_url: user.avatar_url || null,
            message: msg,
            created_at: new Date().toISOString()
          }
          // Broadcast to squad
          io.to(`squad:${sid}`).emit('squad:chat_message', chatMsg)
          // Persist to DB
          if (mode === 'postgres') {
            query(
              'INSERT INTO squad_messages (squad_id, user_id, username, message) VALUES ($1, $2, $3, $4)',
              [sid, user.id, chatMsg.username, msg]
            ).catch(() => {})
          }
          break
        }
      }
    })

    // Get invite code for current squad
    socket.on('squad:get_invite', () => {
      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          socket.emit('squad:invite_code', { code: s.inviteCode, squadName: s.name })
          break
        }
      }
    })

    // Join via invite code
    socket.on('squad:join_invite', ({ code }) => {
      const user = socket.data.user
      if (!user?.id || !code) return
      const squad = getSquadByInviteCode(code)
      if (!squad) return socket.emit('squad:error', { message: 'Invalid or expired invite link' })

      // Leave any previous squad
      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          s.members.delete(socket.id)
          socket.leave(`squad:${sid}`)
          io.to(`squad:${sid}`).emit('squad:member_left', { userId: user.id, memberCount: s.members.size })
          if (s.members.size === 0) { inviteCodes.delete(s.inviteCode); squads.delete(sid) }
        }
      }

      const member = { userId: user.id, username: user.username || 'Anon', avatar_url: user.avatar_url || null, joinedAt: Date.now() }
      squad.members.set(socket.id, member)
      socket.join(`squad:${squad.id}`)

      socket.emit('squad:state', {
        id: squad.id, name: squad.name, matchId: squad.matchId, inviteCode: squad.inviteCode,
        members: [...squad.members.values()], memberCount: squad.members.size
      })
      socket.to(`squad:${squad.id}`).emit('squad:member_joined', { ...member, memberCount: squad.members.size })
    })

    socket.on('squad:challenge', ({ opponentId, predictionId }) => {
      const user = socket.data.user
      if (!user?.id || !opponentId || !predictionId) return
      if (user.id === opponentId) return

      // Find shared squad
      let squadId = null
      for (const [sid, s] of squads) {
        const memberIds = [...s.members.values()].map((m) => m.userId)
        if (memberIds.includes(user.id) && memberIds.includes(opponentId)) {
          squadId = sid
          break
        }
      }
      if (!squadId) return socket.emit('squad:error', { message: 'not in same squad' })

      const duel = {
        id: `duel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        squadId,
        challengerId: user.id,
        challengerName: user.username || 'Anon',
        opponentId,
        predictionId,
        challengerPick: null,
        opponentPick: null,
        result: null,
        createdAt: Date.now()
      }
      duels.push(duel)

      // Notify opponent
      const opponentSocket = findSocketByUserId(io, opponentId)
      if (opponentSocket) {
        opponentSocket.emit('squad:challenge_received', {
          duelId: duel.id,
          challengerId: user.id,
          challengerName: duel.challengerName,
          predictionId
        })
      }
      socket.emit('squad:challenge_sent', { duelId: duel.id })
    })

    socket.on('squad:challenge_accept', ({ duelId }) => {
      const user = socket.data.user
      if (!user?.id) return
      const duel = duels.find((d) => d.id === duelId && d.opponentId === user.id)
      if (!duel) return

      // Notify both parties duel is active
      const challengerSocket = findSocketByUserId(io, duel.challengerId)
      const payload = { duelId: duel.id, predictionId: duel.predictionId, challengerId: duel.challengerId, opponentId: duel.opponentId }
      if (challengerSocket) challengerSocket.emit('squad:duel_active', payload)
      socket.emit('squad:duel_active', payload)
    })

    socket.on('squad:duel_pick', ({ duelId, pick }) => {
      const user = socket.data.user
      if (!user?.id || !pick) return
      const duel = duels.find((d) => d.id === duelId)
      if (!duel) return

      if (user.id === duel.challengerId) duel.challengerPick = pick
      else if (user.id === duel.opponentId) duel.opponentPick = pick
      else return

      // Notify both that a pick was locked (without revealing)
      const update = {
        duelId: duel.id,
        challengerLocked: !!duel.challengerPick,
        opponentLocked: !!duel.opponentPick
      }
      const cs = findSocketByUserId(io, duel.challengerId)
      const os = findSocketByUserId(io, duel.opponentId)
      if (cs) cs.emit('squad:duel_update', update)
      if (os) os.emit('squad:duel_update', update)
    })

    socket.on('disconnect', () => {
      const user = socket.data.user
      for (const [sid, s] of squads) {
        if (s.members.has(socket.id)) {
          s.members.delete(socket.id)
          io.to(`squad:${sid}`).emit('squad:member_left', { userId: user?.id, memberCount: s.members.size })
          if (s.members.size === 0) squads.delete(sid)
        }
      }
      reactionCooldowns.delete(socket.id)
    })
  })
}

// Resolve a duel when prediction resolves (called from prediction resolution logic)
export function resolveDuel(io, predictionId, correctAnswer) {
  const matching = duels.filter((d) => d.predictionId === predictionId && !d.result)
  for (const duel of matching) {
    const cCorrect = duel.challengerPick === correctAnswer
    const oCorrect = duel.opponentPick === correctAnswer
    if (cCorrect && !oCorrect) duel.result = 'challenger_wins'
    else if (!cCorrect && oCorrect) duel.result = 'opponent_wins'
    else duel.result = 'draw'

    const payload = {
      duelId: duel.id,
      result: duel.result,
      correctAnswer,
      challengerPick: duel.challengerPick,
      opponentPick: duel.opponentPick
    }
    const cs = findSocketByUserId(io, duel.challengerId)
    const os = findSocketByUserId(io, duel.opponentId)
    if (cs) cs.emit('squad:duel_result', payload)
    if (os) os.emit('squad:duel_result', payload)
  }
}

export function listSquadsForMatch(matchId) {
  const out = []
  for (const s of squads.values()) {
    if (s.matchId === matchId) {
      out.push({ id: s.id, name: s.name, memberCount: s.members.size, createdBy: s.createdBy })
    }
  }
  return out
}

function findSocketByUserId(io, userId) {
  for (const [, s] of io.sockets.sockets) {
    if (s.data.user?.id === userId) return s
  }
  return null
}
