import { Router } from 'express'
import { z } from 'zod'
import { optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { renderCard, buildDropCardMarkup, htmlToImageReady } from '../services/htmlToImage.js'

const r = Router()

const cardSchema = z.object({
  player: z.string().min(1).max(64),
  minute: z.number().int().min(0).max(130),
  team: z.string().max(64).optional().default(''),
  username: z.string().min(1).max(48).optional().default('guest'),
  accuracy: z.number().min(0).max(100).optional().default(0),
  rarity: z.string().max(24).optional().default('EPIC'),
  is_rare: z.boolean().optional().default(false)
}).strict()

r.post('/card', writeLimiter, optionalAuth, validate({ body: cardSchema }), async (req, res, next) => {
  try {
    if (!htmlToImageReady) {
      return res.status(503).json({ error: 'share_provider_unavailable', detail: 'HCTI keys not configured' })
    }
    const { player, minute, team, username, accuracy, rarity, is_rare } = req.body
    const { html, css } = buildDropCardMarkup({ player, minute, team, username, accuracy, rarity, isRare: is_rare })
    const url = await renderCard({ html, css })
    if (!url) return res.status(502).json({ error: 'render_failed' })
    res.json({ ok: true, url })
  } catch (e) { next(e) }
})

export default r
