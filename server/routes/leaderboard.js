import { Router } from 'express'
import { supabase, ready } from '../db/supabase.js'
import { db } from '../db/memory.js'

const r = Router()

r.get('/:scope', async (req, res, next) => {
  try {
    const scope = req.params.scope
    const matchId = req.query.match_id
    if (ready) {
      // Production: assume a `leaderboard` view aggregated per scope.
      const view = scope === 'match' ? 'leaderboard_match' : scope === 'month' ? 'leaderboard_month' : 'leaderboard_all'
      let q = supabase.from(view).select('*').order('points_total', { ascending: false }).limit(20)
      if (scope === 'match' && matchId) q = q.eq('match_id', matchId)
      const { data, error } = await q
      if (error) throw error
      return res.json(data)
    }
    res.json(memoryLeaderboard(scope, matchId).slice(0, 20))
  } catch (e) { next(e) }
})

r.get('/rank/:userId/:scope', async (req, res, next) => {
  try {
    const all = ready ? await fetchAllRanked(req.params.scope) : memoryLeaderboard(req.params.scope)
    const idx = all.findIndex((row) => row.user_id === req.params.userId)
    if (idx < 0) return res.json({ rank: null, points_total: 0, to_next: 0 })
    const me = all[idx]
    const above = all[idx - 1]
    res.json({ rank: idx + 1, points_total: me.points_total, to_next: above ? above.points_total - me.points_total : 0 })
  } catch (e) { next(e) }
})

async function fetchAllRanked(scope) {
  const view = scope === 'match' ? 'leaderboard_match' : scope === 'month' ? 'leaderboard_month' : 'leaderboard_all'
  const { data } = await supabase.from(view).select('*').order('points_total', { ascending: false })
  return data || []
}

function memoryLeaderboard(scope, matchId) {
  const totals = new Map()
  for (const sub of db.user_predictions) {
    if (scope === 'match' && matchId) {
      const pred = db.predictions.get(sub.prediction_id)
      if (!pred || pred.match_id !== matchId) continue
    }
    if (scope === 'month') {
      const ts = new Date(sub.submitted_at)
      const now = new Date()
      if (ts.getMonth() !== now.getMonth() || ts.getFullYear() !== now.getFullYear()) continue
    }
    const cur = totals.get(sub.user_id) || 0
    totals.set(sub.user_id, cur + (sub.points_earned || 0))
  }
  return [...totals.entries()].map(([user_id, points_total]) => {
    const u = db.users.get(user_id) || { username: user_id.slice(0, 8), tier: 'fan' }
    return { user_id, points_total, username: u.username, tier: u.tier, avatar_url: u.avatar_url }
  }).sort((a, b) => b.points_total - a.points_total)
}

export default r
