import { Router } from 'express'
import { z } from 'zod'
import { supabase, ready } from '../db/supabase.js'
import { db } from '../db/memory.js'
import { requireAuth, requireSelf } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const r = Router()

const patchSchema = z.object({
  username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  avatar_url: z.string().url().max(512).optional(),
  prediction_title: z.string().max(64).optional(),
  tier: z.enum(['fan', 'expert', 'pro', 'legend']).optional(),
  notifications_enabled: z.boolean().optional(),
  strava_connected: z.boolean().optional()
}).strict()

r.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    if (ready) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
      if (error && error.code !== 'PGRST116') throw error
      const { data: vault } = await supabase.from('user_vault').select('*, vault_items(*)').eq('user_id', id)
      return res.json({ ...(data || {}), vault: (vault || []).map((v) => ({ ...v.vault_items, ...v })) })
    }
    const u = db.users.get(id) || autoCreateUser(id)
    const ownedRows = db.user_vault.filter((v) => v.user_id === id)
    const vault = ownedRows.map((row) => ({ ...db.vault_items.get(row.vault_item_id), ...row }))
    res.json({ ...u, vault })
  } catch (e) { next(e) }
})

r.patch('/:id', writeLimiter, requireAuth, requireSelf('id'), validate({ body: patchSchema }), async (req, res, next) => {
  try {
    const id = req.params.id
    const patch = req.body
    if (ready) {
      const { data, error } = await supabase.from('users').update(patch).eq('id', id).select().single()
      if (error) throw error
      return res.json(data)
    }
    const u = db.users.get(id) || autoCreateUser(id)
    Object.assign(u, patch)
    db.users.set(id, u)
    res.json(u)
  } catch (e) { next(e) }
})

r.delete('/:id', writeLimiter, requireAuth, requireSelf('id'), async (req, res, next) => {
  try {
    const id = req.params.id
    if (ready) {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }
    db.users.delete(id)
    res.status(204).end()
  } catch (e) { next(e) }
})

r.get('/:id/history', async (req, res, next) => {
  try {
    const id = req.params.id
    if (ready) {
      const { data, error } = await supabase.rpc('user_match_history', { uid: id }).limit(10)
      if (error && error.code !== 'PGRST202') throw error
      return res.json(data || [])
    }
    const rows = db.user_predictions.filter((u) => u.user_id === id)
    const byMatch = new Map()
    for (const row of rows) {
      const pred = db.predictions.get(row.prediction_id)
      if (!pred) continue
      const m = db.matches.get(pred.match_id)
      if (!m) continue
      const cur = byMatch.get(m.id) || { ...m, predictions_made: 0, predictions_correct: 0, points_earned: 0 }
      cur.predictions_made += 1
      if (row.is_correct) cur.predictions_correct += 1
      cur.points_earned += row.points_earned || 0
      byMatch.set(m.id, cur)
    }
    res.json([...byMatch.values()].slice(0, 10))
  } catch (e) { next(e) }
})

function autoCreateUser(id) {
  const u = { id, username: `op_${id.slice(0, 6)}`, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0, matches_watched: 0, prediction_title: 'Rookie' }
  db.users.set(id, u)
  return u
}

export default r
