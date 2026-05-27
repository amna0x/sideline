import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { startSimulator } from './engine.js'
import { getSquadForUser } from '../socket/squad.js'
import { emitToUser } from '../socket/handlers.js'
import { getUser, updateUser, mode } from '../db/index.js'
import { query } from '../db/postgres.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_FILE = join(__dirname, 'match_demo.json')

let activeDemo = null

export function stopDemoShowcase() {
  if (!activeDemo) return false
  for (const timer of activeDemo.timers) clearTimeout(timer)
  activeDemo.stopMatch?.()
  activeDemo = null
  return true
}

export async function startDemoShowcase(io, opts = {}) {
  stopDemoShowcase()

  const file = opts.file || DEFAULT_FILE
  const speed = opts.speed || 45
  const timeline = JSON.parse(readFileSync(file, 'utf8'))
  const matchId = opts.matchId || timeline.match?.id
  const squadId = opts.squadId || (opts.userId ? (await getSquadForUser(opts.userId))?.id : null)
  const userId = opts.userId || null

  const timers = []
  const schedule = (delayMs, fn) => {
    const timer = setTimeout(fn, delayMs)
    timers.push(timer)
    return timer
  }

  const stopMatch = startSimulator(io, { file, speed })
  activeDemo = { timers, stopMatch, matchId, squadId, userId, startedAt: Date.now() }

  if (userId) {
    schedule(400, async () => {
      const reward = opts.points || 25000
      await addPoints(userId, reward)
      const updated = await getUser(userId)
      emitToUser(io, userId, 'demo:points_awarded', { points_total: Number(updated?.points_total || 0), reward })
    })
  }

  if (squadId) {
    const members = [
      { userId: 'demo_usman', username: 'Usman', avatar_url: null },
      { userId: 'demo_amna', username: 'amna', avatar_url: null },
      { userId: 'demo_mohib', username: 'mohibkhan', avatar_url: null }
    ]

    schedule(1200, () => {
      io.to(`squad:${squadId}`).emit('squad:member_joined', { ...members[0], memberCount: 3 })
      io.to(`squad:${squadId}`).emit('squad:member_joined', { ...members[1], memberCount: 3 })
      io.to(`squad:${squadId}`).emit('squad:member_joined', { ...members[2], memberCount: 3 })
    })

    schedule(2200, () => {
      io.to(`squad:${squadId}`).emit('squad:chat_message', {
        id: `demo_msg_${Date.now()}_1`,
        squad_id: squadId,
        user_id: members[0].userId,
        username: members[0].username,
        avatar_url: members[0].avatar_url,
        message: 'Match Hub live. Replay simulator on.' ,
        msg_type: 'text',
        created_at: new Date().toISOString(),
        seen_by: []
      })
      io.to(`squad:${squadId}`).emit('squad:reaction_burst', { emoji: '⚽', userId: members[0].userId, username: members[0].username, ts: Date.now() })
    })

    schedule(4200, () => {
      io.to(`squad:${squadId}`).emit('squad:chat_message', {
        id: `demo_msg_${Date.now()}_2`,
        squad_id: squadId,
        user_id: members[1].userId,
        username: members[1].username,
        avatar_url: members[1].avatar_url,
        message: 'Prediction card up. Send it.',
        msg_type: 'text',
        created_at: new Date().toISOString(),
        seen_by: []
      })
      io.to(`squad:${squadId}`).emit('squad:reaction_burst', { emoji: '🔥', userId: members[1].userId, username: members[1].username, ts: Date.now() })
    })

    schedule(6500, () => {
      io.to(`squad:${squadId}`).emit('squad:chat_message', {
        id: `demo_msg_${Date.now()}_3`,
        squad_id: squadId,
        user_id: members[2].userId,
        username: members[2].username,
        avatar_url: members[2].avatar_url,
        message: 'Vault unlock after this goal. Nice.',
        msg_type: 'text',
        created_at: new Date().toISOString(),
        seen_by: []
      })
      io.to(`squad:${squadId}`).emit('squad:reaction_burst', { emoji: '👏', userId: members[2].userId, username: members[2].username, ts: Date.now() })
    })
  }

  // Adidas drop overlay for the current user when the key goal moment hits.
  if (userId) {
    schedule(12000, () => {
      emitToUser(io, userId, 'demo:adidas_drop', {
        player_name: 'Brandt',
        minute: 89,
        team: 'home',
        rarity: 'MYTHIC',
        is_rare: true
      })
    })
  }

  return {
    matchId,
    squadId,
    speed,
    stop: stopDemoShowcase
  }
}

async function addPoints(userId, points) {
  if (!userId || !points) return
  if (mode === 'postgres') {
    await query('UPDATE users SET points_total = GREATEST(0, COALESCE(points_total, 0) + $1) WHERE id = $2', [points, userId])
    return
  }
  const user = await getUser(userId)
  if (!user) return
  user.points_total = Math.max(0, Number(user.points_total || 0) + points)
  await updateUser(userId, { points_total: user.points_total })
}