import { Router } from 'express'
import { listSquadsForMatch } from '../socket/squad.js'

const r = Router()

r.get('/rooms', (req, res) => {
  const matchId = req.query.match_id
  if (!matchId) return res.json([])
  res.json(listSquadsForMatch(matchId))
})

export default r
