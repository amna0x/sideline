// Squad rooms — persisted to PostgreSQL, live state via socket.
// Squads survive server restarts. Online presence is tracked in-memory.

import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'

// In-memory live presence: squadId -> Map<socketId, { userId, username, avatar_url }>
const liveMembers = new Map()
const inviteCodeCache = new Map() // inviteCode -> squadId
const reactionCooldowns = new Map()
const duels = []
const liveMessages = new Map()

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function canSeeInviteCode(squadRow, roles, userId) {
  if (!squadRow) return false
  return squadRow.visibility !== 'private' || roles[userId] === 'admin' || !!squadRow.invite_enabled
}

function emitRoomsChanged(io, squadRow, squadId) {
  const matchId = squadRow?.match_id || squadId?.split('::')[0] || 'lobby'
  io.emit('squad:rooms_changed', { matchId })
}

function emitInviteVisibilityChanged(io, squadId, squadRow, roles) {
  const live = liveMembers.get(squadId)
  if (!live) return
  for (const [socketId, member] of live) {
    const targetSocket = io.sockets.sockets.get(socketId)
    if (!targetSocket) continue
    targetSocket.emit('squad:invite_visibility_changed', {
      inviteEnabled: !!squadRow?.invite_enabled,
      inviteCode: canSeeInviteCode(squadRow, roles, member.userId) ? squadRow?.invite_code || '' : ''
    })
  }
}

// --- DB helpers ---

async function dbCreateSquad(id, name, matchId, inviteCode, visibility, createdBy) {
  if (mode !== 'postgres') return
  await query(
    `INSERT INTO squads (id, name, match_id, invite_code, visibility, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
    [id, name, matchId, inviteCode, visibility, createdBy]
  )
}

async function dbAddMember(squadId, userId, role) {
  if (mode !== 'postgres') return
  await query(
    `INSERT INTO squad_members (squad_id, user_id, role)
     VALUES ($1, $2, $3) ON CONFLICT (squad_id, user_id) DO UPDATE SET role = $3`,
    [squadId, userId, role]
  )
}

async function dbAddMemberIfNotExists(squadId, userId) {
  if (mode !== 'postgres') return
  await query(
    `INSERT INTO squad_members (squad_id, user_id, role)
     VALUES ($1, $2, 'member') ON CONFLICT (squad_id, user_id) DO NOTHING`,
    [squadId, userId]
  )
}

async function dbRemoveMember(squadId, userId) {
  if (mode !== 'postgres') return
  await query('DELETE FROM squad_members WHERE squad_id = $1 AND user_id = $2', [squadId, userId])
}

async function dbSetRole(squadId, userId, role) {
  if (mode !== 'postgres') return
  await query('UPDATE squad_members SET role = $1 WHERE squad_id = $2 AND user_id = $3', [role, squadId, userId])
}

async function dbSetVisibility(squadId, visibility) {
  if (mode !== 'postgres') return
  await query('UPDATE squads SET visibility = $1 WHERE id = $2', [visibility, squadId])
}

async function dbSetInviteEnabled(squadId, enabled) {
  if (mode !== 'postgres') return
  await query('UPDATE squads SET invite_enabled = $1 WHERE id = $2', [!!enabled, squadId])
}

async function dbGetSquad(squadId) {
  if (mode !== 'postgres') return null
  const { rows } = await query('SELECT * FROM squads WHERE id = $1', [squadId])
  return rows[0] || null
}

async function dbGetSquadByInvite(code) {
  if (mode !== 'postgres') return null
  const { rows } = await query('SELECT * FROM squads WHERE invite_code = $1', [code])
  return rows[0] || null
}

async function dbGetSquadMembers(squadId) {
  if (mode !== 'postgres') return []
  const { rows } = await query(
    `SELECT sm.user_id, sm.role, u.username, u.avatar_url
     FROM squad_members sm JOIN users u ON u.id = sm.user_id
     WHERE sm.squad_id = $1
     ORDER BY CASE sm.role WHEN 'admin' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END, sm.joined_at ASC, u.username ASC`,
    [squadId]
  )
  return rows
}

async function dbGetSquadRoles(squadId) {
  if (mode !== 'postgres') return {}
  const { rows } = await query('SELECT user_id, role FROM squad_members WHERE squad_id = $1', [squadId])
  const roles = {}
  rows.forEach((r) => { roles[r.user_id] = r.role })
  return roles
}

async function dbGetNextMember(squadId, excludeUserId) {
  if (mode !== 'postgres') return null
  const { rows } = await query(
    `SELECT sm.user_id, u.username FROM squad_members sm
     JOIN users u ON u.id = sm.user_id
     WHERE sm.squad_id = $1 AND sm.user_id != $2
     ORDER BY sm.joined_at ASC LIMIT 1`,
    [squadId, excludeUserId]
  )
  return rows[0] || null
}

async function dbDeleteSquad(squadId) {
  if (mode !== 'postgres') return
  await query('DELETE FROM squad_members WHERE squad_id = $1', [squadId])
  await query('DELETE FROM squads WHERE id = $1', [squadId])
}

async function dbGetUserSquad(userId) {
  if (mode !== 'postgres') return null
  const { rows } = await query(
    `SELECT s.id, s.name, s.visibility, s.invite_code, sm.role,
       s.match_id,
       (SELECT COUNT(*) FROM squad_members WHERE squad_id = s.id)::int as member_count
     FROM squad_members sm JOIN squads s ON s.id = sm.squad_id
     WHERE sm.user_id = $1 LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

async function dbGetChatHistory(squadId, limit = 50) {
  if (mode !== 'postgres') return []
  const { rows } = await query(
    `SELECT sm.*, u.avatar_url as user_avatar
     FROM squad_messages sm
     LEFT JOIN users u ON u.id = sm.user_id
     WHERE sm.squad_id = $1
     ORDER BY sm.created_at DESC LIMIT $2`,
    [squadId, limit]
  )
  return rows.reverse().map((r) => ({
    id: r.id,
    squad_id: r.squad_id,
    user_id: r.user_id,
    username: r.username,
    avatar_url: r.user_avatar || r.avatar_url,
    message: r.message,
    msg_type: r.msg_type || 'text',
    sticker_id: r.sticker_id,
    reply_to_id: r.reply_to_id,
    reply_to_text: r.reply_to_text,
    reply_to_username: r.reply_to_username,
    created_at: r.created_at,
    edited_at: r.edited_at,
    deleted_at: r.deleted_at
  }))
}

async function dbGetMessage(messageId, squadId) {
  const live = liveMessages.get(messageId)
  if (mode !== 'postgres') {
    return live?.squad_id === squadId ? live : null
  }
  const { rows } = await query('SELECT * FROM squad_messages WHERE id = $1 AND squad_id = $2 LIMIT 1', [messageId, squadId])
  return rows[0] || (live?.squad_id === squadId ? live : null)
}

async function dbListSquads(matchId) {
  if (mode !== 'postgres') return []
  const { rows } = await query(
    `SELECT s.id, s.name, s.visibility, s.created_by, s.invite_code,
       (SELECT COUNT(*) FROM squad_members WHERE squad_id = s.id)::int as member_count
     FROM squads s WHERE s.match_id = $1 AND s.visibility = 'public'
     ORDER BY member_count DESC`,
    [matchId]
  )
  return rows
}

// --- Exports for routes ---

export async function getSquadByInviteCode(code) {
  if (mode !== 'postgres') {
    // Fallback in-memory for non-postgres mode
    return null
  }
  return dbGetSquadByInvite(code)
}

export async function getSquadForUser(userId) {
  if (!userId) return null
  if (mode !== 'postgres') return null
  return dbGetUserSquad(userId)
}

export async function listSquadsForMatch(matchId) {
  if (mode !== 'postgres') return []
  const squads = await dbListSquads(matchId)
  return squads.map((s) => ({
    id: s.id,
    name: s.name,
    memberCount: s.member_count,
    createdBy: s.created_by,
    visibility: s.visibility
  }))
}

// --- Socket handlers ---

export function registerSquadHandlers(io) {
  io.on('connection', (socket) => {

    socket.on('squad:join', async ({ squadName, matchId }) => {
      if (!squadName || !matchId) return
      const user = socket.data.user
      if (!user?.id) return socket.emit('squad:error', { message: 'auth required' })

      const squadId = `${matchId}::${squadName.toLowerCase().trim()}`

      // Check if squad exists in DB, create if not
      let squadRow = await dbGetSquad(squadId).catch(() => null)
      if (!squadRow) {
        const inviteCode = genCode()
        await dbCreateSquad(squadId, squadName.trim(), matchId, inviteCode, 'public', user.id).catch(() => {})
        await dbAddMember(squadId, user.id, 'admin').catch(() => {})
        inviteCodeCache.set(inviteCode, squadId)
      } else {
        const existingRoles = await dbGetSquadRoles(squadId).catch(() => ({}))
        if (squadRow.visibility === 'private' && !existingRoles[user.id]) {
          return socket.emit('squad:error', { message: 'This squad is private' })
        }
        // Add as member if not already (preserve existing role if they're rejoining)
        await dbAddMemberIfNotExists(squadId, user.id).catch(() => {})
        if (squadRow.invite_code) inviteCodeCache.set(squadRow.invite_code, squadId)
      }

      // Leave any previous squad socket rooms
      leaveAllRooms(socket, io)

      // Track live presence
      if (!liveMembers.has(squadId)) liveMembers.set(squadId, new Map())
      const live = liveMembers.get(squadId)
      live.set(socket.id, { userId: user.id, username: user.username || 'Anon', avatar_url: user.avatar_url || null })
      socket.join(`squad:${squadId}`)

      // Send full state
      const dbSquad = await dbGetSquad(squadId).catch(() => null)
      const members = await dbGetSquadMembers(squadId).catch(() => [])
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))

      socket.emit('squad:state', {
        id: squadId,
        name: dbSquad?.name || squadName.trim(),
        matchId,
        inviteCode: canSeeInviteCode(dbSquad, roles, user.id) ? dbSquad?.invite_code || '' : '',
        inviteEnabled: !!dbSquad?.invite_enabled,
        visibility: dbSquad?.visibility || 'public',
        members: members.map((m) => ({ userId: m.user_id, username: m.username, avatar_url: m.avatar_url })),
        memberCount: members.length,
        roles,
        createdBy: dbSquad?.created_by
      })

      // Send chat history
      const history = await dbGetChatHistory(squadId).catch(() => [])
      socket.emit('squad:chat_history', history)

      socket.to(`squad:${squadId}`).emit('squad:member_joined', {
        userId: user.id, username: user.username || 'Anon', avatar_url: user.avatar_url || null, memberCount: members.length
      })
      emitRoomsChanged(io, dbSquad, squadId)
    })

    socket.on('squad:leave', async () => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return

      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      const isAdmin = roles[user.id] === 'admin'

      if (isAdmin) {
        // Transfer admin to next member (by join date)
        const nextAdmin = await dbGetNextMember(squadId, user.id).catch(() => null)
        if (nextAdmin) {
          await dbSetRole(squadId, nextAdmin.user_id, 'admin').catch(() => {})
          await dbRemoveMember(squadId, user.id).catch(() => {})
          const newRoles = await dbGetSquadRoles(squadId).catch(() => ({}))
          io.to(`squad:${squadId}`).emit('squad:roles_updated', { roles: newRoles })
          io.to(`squad:${squadId}`).emit('squad:admin_transferred', { newAdminId: nextAdmin.user_id, newAdminName: nextAdmin.username })
        } else {
          // No one left — disband
          await dbRemoveMember(squadId, user.id).catch(() => {})
          await dbDeleteSquad(squadId).catch(() => {})
        }
      } else {
        await dbRemoveMember(squadId, user.id).catch(() => {})
      }

      leaveAllRooms(socket, io)
      const members = await dbGetSquadMembers(squadId).catch(() => [])
      io.to(`squad:${squadId}`).emit('squad:member_left', { userId: user.id, memberCount: members.length })
      const squadRow = await dbGetSquad(squadId).catch(() => null)
      emitRoomsChanged(io, squadRow, squadId)
    })

    // Check what happens if user leaves (for confirmation UI)
    socket.on('squad:check_leave', async (_, callback) => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      const isAdmin = roles[user.id] === 'admin'
      if (!isAdmin) {
        socket.emit('squad:leave_info', { type: 'member' })
        return
      }
      const nextAdmin = await dbGetNextMember(squadId, user.id).catch(() => null)
      if (nextAdmin) {
        socket.emit('squad:leave_info', { type: 'transfer', nextAdminName: nextAdmin.username })
      } else {
        socket.emit('squad:leave_info', { type: 'disband' })
      }
    })

    socket.on('squad:set_visibility', async ({ visibility }) => {
      const user = socket.data.user
      if (!user?.id) return
      if (visibility !== 'public' && visibility !== 'private') return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      if (roles[user.id] !== 'admin') return socket.emit('squad:error', { message: 'Only the admin can change visibility' })
      await dbSetVisibility(squadId, visibility).catch(() => {})
      const squadRow = await dbGetSquad(squadId).catch(() => null)
      io.to(`squad:${squadId}`).emit('squad:visibility_changed', { visibility, inviteEnabled: !!squadRow?.invite_enabled })
      emitRoomsChanged(io, squadRow, squadId)
    })

    socket.on('squad:set_invite_enabled', async ({ enabled }) => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      if (roles[user.id] !== 'admin') return socket.emit('squad:error', { message: 'Only the admin can change invite sharing' })
      await dbSetInviteEnabled(squadId, !!enabled).catch(() => {})
      const squadRow = await dbGetSquad(squadId).catch(() => null)
      emitInviteVisibilityChanged(io, squadId, squadRow, roles)
    })

    socket.on('squad:promote', async ({ targetUserId }) => {
      const user = socket.data.user
      if (!user?.id || !targetUserId || targetUserId === user.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      if (roles[user.id] !== 'admin') return socket.emit('squad:error', { message: 'Only the admin can promote' })
      // Demote existing moderator
      for (const [uid, role] of Object.entries(roles)) {
        if (role === 'moderator') await dbSetRole(squadId, uid, 'member').catch(() => {})
      }
      await dbSetRole(squadId, targetUserId, 'moderator').catch(() => {})
      const newRoles = await dbGetSquadRoles(squadId).catch(() => ({}))
      io.to(`squad:${squadId}`).emit('squad:roles_updated', { roles: newRoles })
    })

    socket.on('squad:demote', async ({ targetUserId }) => {
      const user = socket.data.user
      if (!user?.id || !targetUserId) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      if (roles[user.id] !== 'admin') return socket.emit('squad:error', { message: 'Only the admin can demote' })
      await dbSetRole(squadId, targetUserId, 'member').catch(() => {})
      const newRoles = await dbGetSquadRoles(squadId).catch(() => ({}))
      io.to(`squad:${squadId}`).emit('squad:roles_updated', { roles: newRoles })
    })

    socket.on('squad:kick', async ({ targetUserId }) => {
      const user = socket.data.user
      if (!user?.id || !targetUserId || targetUserId === user.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      const myRole = roles[user.id]
      if (myRole !== 'admin' && myRole !== 'moderator') return socket.emit('squad:error', { message: 'Only admin or moderator can kick' })
      if (roles[targetUserId] === 'admin') return socket.emit('squad:error', { message: 'Cannot kick the admin' })
      await dbRemoveMember(squadId, targetUserId).catch(() => {})
      // Disconnect target socket
      const live = liveMembers.get(squadId)
      if (live) {
        for (const [sid, m] of live) {
          if (m.userId === targetUserId) {
            live.delete(sid)
            const targetSocket = io.sockets.sockets.get(sid)
            if (targetSocket) {
              targetSocket.leave(`squad:${squadId}`)
              targetSocket.emit('squad:kicked', { squadName: squadId.split('::')[1] || 'Squad' })
            }
            break
          }
        }
      }
      const members = await dbGetSquadMembers(squadId).catch(() => [])
      io.to(`squad:${squadId}`).emit('squad:member_left', { userId: targetUserId, memberCount: members.length })
    })

    socket.on('squad:reaction', ({ emoji }) => {
      const user = socket.data.user
      if (!user?.id) return
      const allowed = ['⚽', '🔥', '😱', '👏', '💀']
      if (!allowed.includes(emoji)) return
      const now = Date.now()
      const last = reactionCooldowns.get(socket.id) || 0
      if (now - last < 500) return
      reactionCooldowns.set(socket.id, now)
      const squadId = getSquadIdForSocket(socket)
      if (squadId) {
        io.to(`squad:${squadId}`).emit('squad:reaction_burst', { emoji, userId: user.id, username: user.username || 'Anon', ts: now })
      }
    })

    socket.on('squad:message', async ({ text, replyTo, msgType, stickerId }) => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return

      const type = msgType === 'sticker' ? 'sticker' : 'text'
      const msg = type === 'text' ? (text || '').trim().slice(0, 500) : ''
      if (type === 'text' && !msg) return

      const chatMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        squad_id: squadId, user_id: user.id, username: user.username || 'Anon',
        avatar_url: user.avatar_url || null, message: msg,
        msg_type: type, sticker_id: stickerId || null,
        reply_to_id: replyTo?.id || null,
        reply_to_text: replyTo?.text?.slice(0, 100) || null,
        reply_to_username: replyTo?.username || null,
        created_at: new Date().toISOString(),
        seen_by: []
      }
      if (mode === 'postgres') {
        const inserted = await query(
          `INSERT INTO squad_messages (squad_id, user_id, username, message, avatar_url, reply_to_id, reply_to_text, reply_to_username, msg_type, sticker_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, created_at`,
          [squadId, user.id, chatMsg.username, msg, chatMsg.avatar_url, chatMsg.reply_to_id, chatMsg.reply_to_text, chatMsg.reply_to_username, type, chatMsg.sticker_id]
        ).catch(() => null)
        if (inserted?.rows?.[0]) {
          chatMsg.id = inserted.rows[0].id
          chatMsg.created_at = inserted.rows[0].created_at
        }
      }
      liveMessages.set(chatMsg.id, chatMsg)
      io.to(`squad:${squadId}`).emit('squad:chat_message', chatMsg)
    })

    socket.on('squad:message_edit', async ({ messageId, text }) => {
      const user = socket.data.user
      if (!user?.id || !messageId) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const msg = (text || '').trim().slice(0, 500)
      if (!msg) return

      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      const canModerate = roles[user.id] === 'admin' || roles[user.id] === 'moderator'
      const existing = await dbGetMessage(messageId, squadId).catch(() => null)
      if (!existing) return socket.emit('squad:error', { message: 'Message not found' })
      if (existing.user_id !== user.id && !canModerate) {
        return socket.emit('squad:error', { message: 'You cannot edit this message' })
      }

      const editedAt = new Date().toISOString()
      if (mode === 'postgres') {
        await query(
          `UPDATE squad_messages
           SET message = $1, msg_type = 'text', edited_at = NOW(), deleted_at = NULL
           WHERE id = $2 AND squad_id = $3`,
          [msg, messageId, squadId]
        ).catch(() => {})
      }
      liveMessages.set(messageId, { ...(liveMessages.get(messageId) || existing || {}), message: msg, msg_type: 'text', edited_at: editedAt, deleted_at: null })
      io.to(`squad:${squadId}`).emit('squad:message_updated', { messageId, message: msg, edited_at: editedAt })
    })

    socket.on('squad:message_delete', async ({ messageId }) => {
      const user = socket.data.user
      if (!user?.id || !messageId) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return

      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      const canModerate = roles[user.id] === 'admin' || roles[user.id] === 'moderator'
      const existing = await dbGetMessage(messageId, squadId).catch(() => null)
      if (!existing) return socket.emit('squad:error', { message: 'Message not found' })
      if (existing.user_id !== user.id && !canModerate) {
        return socket.emit('squad:error', { message: 'You cannot delete this message' })
      }

      const deletedAt = new Date().toISOString()
      if (mode === 'postgres') {
        await query(
          `UPDATE squad_messages
           SET message = '', msg_type = 'deleted', deleted_at = NOW()
           WHERE id = $1 AND squad_id = $2`,
          [messageId, squadId]
        ).catch(() => {})
      }
      liveMessages.set(messageId, { ...(liveMessages.get(messageId) || existing || {}), message: '', msg_type: 'deleted', deleted_at: deletedAt })
      io.to(`squad:${squadId}`).emit('squad:message_deleted', { messageId, deleted_at: deletedAt })
    })

    socket.on('squad:clear_chat', async () => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return

      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      if (roles[user.id] !== 'admin') {
        return socket.emit('squad:error', { message: 'Only the squad admin can clear chat' })
      }

      if (mode === 'postgres') {
        await query('DELETE FROM message_seen WHERE squad_id = $1', [squadId]).catch(() => {})
        await query('DELETE FROM squad_messages WHERE squad_id = $1', [squadId]).catch(() => {})
      }
      for (const [messageId, msg] of liveMessages) {
        if (msg.squad_id === squadId) liveMessages.delete(messageId)
      }
      io.to(`squad:${squadId}`).emit('squad:chat_cleared')
    })

    // Seen receipts
    socket.on('squad:mark_seen', async ({ messageId }) => {
      const user = socket.data.user
      if (!user?.id || !messageId) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      if (mode === 'postgres') {
        await query(
          'INSERT INTO message_seen (message_id, squad_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [messageId, squadId, user.id]
        ).catch(() => {})
      }
      // Broadcast seen to squad
      io.to(`squad:${squadId}`).emit('squad:message_seen', { messageId, userId: user.id, username: user.username || 'Anon' })
    })

    socket.on('squad:typing', () => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (squadId) socket.to(`squad:${squadId}`).emit('squad:user_typing', { userId: user.id, username: user.username || 'Anon' })
    })

    socket.on('squad:get_invite', async () => {
      const user = socket.data.user
      if (!user?.id) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const squadRow = await dbGetSquad(squadId).catch(() => null)
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      if (!canSeeInviteCode(squadRow, roles, user.id)) {
        return socket.emit('squad:error', { message: 'Invite code is private' })
      }
      if (squadRow) socket.emit('squad:invite_code', { code: squadRow.invite_code, squadName: squadRow.name })
    })

    socket.on('squad:join_invite', async ({ code }) => {
      const user = socket.data.user
      if (!user?.id || !code) return
      const squadRow = await dbGetSquadByInvite(code.toUpperCase()).catch(() => null)
      if (!squadRow) return socket.emit('squad:error', { message: 'Invalid or expired invite link' })
      const squadId = squadRow.id

      leaveAllRooms(socket, io)
      await dbAddMemberIfNotExists(squadId, user.id).catch(() => {})

      if (!liveMembers.has(squadId)) liveMembers.set(squadId, new Map())
      liveMembers.get(squadId).set(socket.id, { userId: user.id, username: user.username || 'Anon', avatar_url: user.avatar_url || null })
      socket.join(`squad:${squadId}`)

      const members = await dbGetSquadMembers(squadId).catch(() => [])
      const roles = await dbGetSquadRoles(squadId).catch(() => ({}))
      socket.emit('squad:state', {
        id: squadId, name: squadRow.name, matchId: squadRow.match_id,
        inviteCode: canSeeInviteCode(squadRow, roles, user.id) ? squadRow.invite_code : '',
        inviteEnabled: !!squadRow.invite_enabled,
        visibility: squadRow.visibility,
        members: members.map((m) => ({ userId: m.user_id, username: m.username, avatar_url: m.avatar_url })),
        memberCount: members.length, roles, createdBy: squadRow.created_by
      })
      const history = await dbGetChatHistory(squadId).catch(() => [])
      socket.emit('squad:chat_history', history)
      socket.to(`squad:${squadId}`).emit('squad:member_joined', { userId: user.id, username: user.username || 'Anon', avatar_url: user.avatar_url || null, memberCount: members.length })
      emitRoomsChanged(io, squadRow, squadId)
    })

    socket.on('squad:challenge', ({ opponentId, predictionId }) => {
      const user = socket.data.user
      if (!user?.id || !opponentId || !predictionId || user.id === opponentId) return
      const squadId = getSquadIdForSocket(socket)
      if (!squadId) return
      const duel = {
        id: `duel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        squadId, challengerId: user.id, challengerName: user.username || 'Anon',
        opponentId, predictionId, challengerPick: null, opponentPick: null, result: null, createdAt: Date.now()
      }
      duels.push(duel)
      const opponentSocket = findSocketByUserId(io, opponentId)
      if (opponentSocket) opponentSocket.emit('squad:challenge_received', { duelId: duel.id, challengerId: user.id, challengerName: duel.challengerName, predictionId })
      socket.emit('squad:challenge_sent', { duelId: duel.id })
    })

    socket.on('squad:challenge_accept', ({ duelId }) => {
      const user = socket.data.user
      if (!user?.id) return
      const duel = duels.find((d) => d.id === duelId && d.opponentId === user.id)
      if (!duel) return
      const cs = findSocketByUserId(io, duel.challengerId)
      const payload = { duelId: duel.id, predictionId: duel.predictionId, challengerId: duel.challengerId, opponentId: duel.opponentId }
      if (cs) cs.emit('squad:duel_active', payload)
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
      const update = { duelId: duel.id, challengerLocked: !!duel.challengerPick, opponentLocked: !!duel.opponentPick }
      const cs = findSocketByUserId(io, duel.challengerId)
      const os = findSocketByUserId(io, duel.opponentId)
      if (cs) cs.emit('squad:duel_update', update)
      if (os) os.emit('squad:duel_update', update)
    })

    socket.on('disconnect', () => {
      leaveAllRooms(socket, io)
      reactionCooldowns.delete(socket.id)
    })
  })
}

// --- Helpers ---

function getSquadIdForSocket(socket) {
  for (const [squadId, members] of liveMembers) {
    if (members.has(socket.id)) return squadId
  }
  return null
}

function leaveAllRooms(socket, io) {
  const user = socket.data.user
  for (const [squadId, members] of liveMembers) {
    if (members.has(socket.id)) {
      members.delete(socket.id)
      socket.leave(`squad:${squadId}`)
      io.to(`squad:${squadId}`).emit('squad:member_left', { userId: user?.id, memberCount: members.size })
    }
  }
}

function findSocketByUserId(io, userId) {
  for (const [, s] of io.sockets.sockets) {
    if (s.data.user?.id === userId) return s
  }
  return null
}

export function resolveDuel(io, predictionId, correctAnswer) {
  const matching = duels.filter((d) => d.predictionId === predictionId && !d.result)
  for (const duel of matching) {
    const cCorrect = duel.challengerPick === correctAnswer
    const oCorrect = duel.opponentPick === correctAnswer
    if (cCorrect && !oCorrect) duel.result = 'challenger_wins'
    else if (!cCorrect && oCorrect) duel.result = 'opponent_wins'
    else duel.result = 'draw'
    const payload = { duelId: duel.id, result: duel.result, correctAnswer, challengerPick: duel.challengerPick, opponentPick: duel.opponentPick }
    const cs = findSocketByUserId(io, duel.challengerId)
    const os = findSocketByUserId(io, duel.opponentId)
    if (cs) cs.emit('squad:duel_result', payload)
    if (os) os.emit('squad:duel_result', payload)
  }
}
