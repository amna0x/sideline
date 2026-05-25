import { Router } from 'express'
import { z } from 'zod'
import { getUser, createUser, updateUser, deleteUser, getUserVault, getUserMatchHistory, mode } from '../db/index.js'
import { requireAuth, requireSelf } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter, makeLimiter } from '../middleware/rateLimit.js'
import { handleAvatarUpload, extForMime } from '../middleware/upload.js'

const r = Router()

const patchSchema = z.object({
  username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  avatar_url: z.string().url().max(512).optional(),
  prediction_title: z.string().max(64).optional(),
  tier: z.enum(['fan', 'expert', 'pro', 'legend']).optional(),
  notifications_enabled: z.boolean().optional(),
  strava_connected: z.boolean().optional()
}).strict()

const avatarLimiter = makeLimiter({ windowMs: 60 * 1000, max: 10 })

r.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    let user = await getUser(id)
    if (!user) user = await autoCreateUser(id)
    const vault = await getUserVault(id)
    res.json({ ...user, vault })
  } catch (e) { next(e) }
})

r.patch('/:id', writeLimiter, requireAuth, requireSelf('id'), validate({ body: patchSchema }), async (req, res, next) => {
  try {
    const id = req.params.id
    let user = await getUser(id)
    if (!user) user = await autoCreateUser(id)
    const updated = await updateUser(id, req.body)
    res.json(updated)
  } catch (e) { next(e) }
})

r.delete('/:id', writeLimiter, requireAuth, requireSelf('id'), async (req, res, next) => {
  try {
    await deleteUser(req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
})

r.post('/:id/avatar', avatarLimiter, requireAuth, requireSelf('id'), handleAvatarUpload, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'missing_file' })
    const userId = req.params.id

    // Ensure user exists
    let user = await getUser(userId)
    if (!user) user = await autoCreateUser(userId)

    // For now: store as data URL in memory/postgres. S3 upload can be added later.
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    await updateUser(userId, { avatar_url: dataUrl })
    res.json({ ok: true, avatar_url: dataUrl })
  } catch (e) { next(e) }
})

r.get('/:id/history', async (req, res, next) => {
  try {
    res.json(await getUserMatchHistory(req.params.id))
  } catch (e) { next(e) }
})

async function autoCreateUser(id) {
  const u = { id, username: `op_${id.slice(0, 6)}`, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0, matches_watched: 0, prediction_title: 'Rookie' }
  return await createUser(u)
}

export default r
