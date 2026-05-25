import { Router } from 'express'
import { listSquadsForMatch, getSquadByInviteCode, generateInviteCode } from '../socket/squad.js'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'

const r = Router()

r.get('/rooms', (req, res) => {
  const matchId = req.query.match_id
  if (!matchId) return res.json([])
  res.json(listSquadsForMatch(matchId))
})

// Get invite link info
r.get('/invite/:code', (req, res) => {
  const squad = getSquadByInviteCode(req.params.code)
  if (!squad) return res.status(404).json({ error: 'invite_expired' })
  res.json({ id: squad.id, name: squad.name, memberCount: squad.members.size, matchId: squad.matchId })
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

export default r
