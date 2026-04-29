import { Router } from 'express'
import { z } from 'zod'
import { supabase, ready } from '../db/supabase.js'
import { db } from '../db/memory.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const r = Router()

const submitSchema = z.object({
  prediction_id: z.string().min(1).max(64),
  selected_option: z.string().min(1).max(64),
  speed_ms: z.number().int().nonnegative().max(600000).optional()
})

r.get('/active', async (req, res, next) => {
  try {
    const matchId = req.query.match_id
    if (!matchId) return res.json([])
    const now = new Date().toISOString()
    if (ready) {
      const { data, error } = await supabase.from('predictions').select('*')
        .eq('match_id', matchId).is('resolved_at', null).lte('opens_at', now).gt('closes_at', now)
        .order('opens_at')
      if (error) throw error
      return res.json(data)
    }
    const out = [...db.predictions.values()].filter((p) =>
      p.match_id === matchId && !p.resolved_at && new Date(p.opens_at) <= new Date() && new Date(p.closes_at) > new Date()
    )
    res.json(out)
  } catch (e) { next(e) }
})

r.get('/upcoming/:matchId', async (req, res, next) => {
  try {
    const now = new Date().toISOString()
    if (ready) {
      const { data, error } = await supabase.from('predictions').select('*')
        .eq('match_id', req.params.matchId).gt('opens_at', now).order('opens_at').limit(2)
      if (error) throw error
      return res.json(data)
    }
    const out = [...db.predictions.values()]
      .filter((p) => p.match_id === req.params.matchId && p.opens_at && new Date(p.opens_at) > new Date())
      .sort((a, b) => new Date(a.opens_at) - new Date(b.opens_at))
      .slice(0, 2)
    res.json(out)
  } catch (e) { next(e) }
})

r.post('/submit', writeLimiter, requireAuth, validate({ body: submitSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { prediction_id, selected_option, speed_ms } = req.body

    let prediction
    if (ready) {
      const { data, error } = await supabase.from('predictions').select('*').eq('id', prediction_id).single()
      if (error) throw error
      prediction = data
    } else prediction = db.predictions.get(prediction_id)
    if (!prediction) return res.status(404).json({ error: 'prediction not found' })
    if (prediction.resolved_at) return res.status(400).json({ error: 'prediction already resolved' })
    if (new Date(prediction.closes_at) <= new Date()) return res.status(400).json({ error: 'prediction closed' })

    const speedBonus = speed_ms != null && speed_ms < 30000 ? 1.5 : 1
    const record = {
      id: cryptoId(),
      user_id: userId, prediction_id, selected_option,
      submitted_at: new Date().toISOString(),
      points_earned: null, is_correct: null,
      speed_ms: speed_ms || null, speed_bonus: speedBonus
    }

    if (ready) {
      const { error } = await supabase.from('user_predictions').insert(record)
      if (error) throw error
    } else {
      const existing = db.user_predictions.find((u) => u.user_id === userId && u.prediction_id === prediction_id)
      if (existing) return res.status(400).json({ error: 'already submitted' })
      db.user_predictions.push(record)
    }
    res.json({ ok: true, submission: record })
  } catch (e) { next(e) }
})

function cryptoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export default r
