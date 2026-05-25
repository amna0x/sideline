import { Router } from 'express'
import { getLeaderboard, getUserRank } from '../db/index.js'

const r = Router()

r.get('/:scope', async (req, res, next) => {
  try {
    const scope = req.params.scope
    const matchId = req.query.match_id
    res.json(await getLeaderboard(scope, matchId))
  } catch (e) { next(e) }
})

r.get('/rank/:userId/:scope', async (req, res, next) => {
  try {
    res.json(await getUserRank(req.params.userId, req.params.scope))
  } catch (e) { next(e) }
})

export default r
