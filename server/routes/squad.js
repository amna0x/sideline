import { Router } from 'express'
import { listSquadsForMatch, getSquadByInviteCode, getSquadForUser } from '../socket/squad.js'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'

const r = Router()

r.get('/rooms', async (req, res, next) => {
  try {
    const matchId = req.query.match_id || 'lobby'
    const rooms = await listSquadsForMatch(matchId)
    res.json(rooms)
  } catch (e) { next(e) }
})

// Get invite link info
r.get('/invite/:code', async (req, res, next) => {
  try {
    const squad = await getSquadByInviteCode(req.params.code)
    if (!squad) return res.status(404).json({ error: 'invite_expired' })
    res.json({ id: squad.id, name: squad.name, memberCount: squad.member_count, matchId: squad.match_id })
  } catch (e) { next(e) }
})

// Get chat history for a squad
r.get('/:squadId/messages', requireAuth, async (req, res, next) => {
  try {
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query(
      'SELECT * FROM squad_messages WHERE squad_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.params.squadId]
    )
    res.json(rows.reverse())
  } catch (e) { next(e) }
})

// Get a user's current squad (for profile display)
r.get('/user/:userId', async (req, res, next) => {
  try {
    const squad = await getSquadForUser(req.params.userId)
    if (!squad) return res.json(null)
    if (squad.visibility === 'private') {
      return res.json({ id: squad.id, name: null, visibility: 'private', memberCount: squad.member_count })
    }
    res.json({ id: squad.id, name: squad.name, visibility: squad.visibility, memberCount: squad.member_count, role: squad.role })
  } catch (e) { next(e) }
})

export default r
