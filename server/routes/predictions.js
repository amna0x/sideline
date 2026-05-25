import { Router } from 'express'
import { z } from 'zod'
import { getActivePredictions, getUpcomingPredictions, getPrediction, submitPrediction, hasUserSubmitted, mode } from '../db/index.js'
import { db as mem } from '../db/memory.js'
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
    res.json(await getActivePredictions(matchId))
  } catch (e) { next(e) }
})

r.get('/upcoming/:matchId', async (req, res, next) => {
  try {
    res.json(await getUpcomingPredictions(req.params.matchId))
  } catch (e) { next(e) }
})

r.post('/submit', writeLimiter, requireAuth, validate({ body: submitSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { prediction_id, selected_option, speed_ms } = req.body

    const prediction = await getPrediction(prediction_id)
    if (!prediction) return res.status(404).json({ error: 'prediction not found' })
    if (prediction.resolved_at) return res.status(400).json({ error: 'prediction already resolved' })
    if (new Date(prediction.closes_at) <= new Date()) return res.status(400).json({ error: 'prediction closed' })

    if (await hasUserSubmitted(userId, prediction_id)) {
      return res.status(400).json({ error: 'already submitted' })
    }

    const speedBonus = speed_ms != null && speed_ms < 30000 ? 1.5 : 1
    const record = {
      user_id: userId, prediction_id, selected_option,
      submitted_at: new Date().toISOString(),
      points_earned: null, is_correct: null,
      speed_ms: speed_ms || null, speed_bonus: speedBonus
    }

    const saved = await submitPrediction(record)

    // Increment submission count on the prediction (for display)
    if (mode === 'memory') {
      const p = mem.predictions.get(prediction_id)
      if (p) p.submission_count = (p.submission_count || 0) + 1
    } else if (mode === 'postgres') {
      // No submission_count column — handled client-side
    }

    res.json({ ok: true, submission: saved })
  } catch (e) { next(e) }
})

export default r
