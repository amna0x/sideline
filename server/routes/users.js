import { Router } from 'express'
import { z } from 'zod'
import { getUser, createUser, updateUser, deleteUser, getUserVault, getUserMatchHistory, mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { requireAuth, requireSelf, optionalAuth } from '../middleware/auth.js'
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

r.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = req.params.id
    let user = await getUser(id)
    if (!user) user = await autoCreateUser(id, req)
    // Update email from auth if missing
    if (!user.email && req.user?.email) {
      user = await updateUser(id, { email: req.user.email })
    }
    const vault = await getUserVault(id)
    res.json({ ...user, vault })
  } catch (e) { next(e) }
})

r.patch('/:id', writeLimiter, requireAuth, requireSelf('id'), validate({ body: patchSchema }), async (req, res, next) => {
  try {
    const id = req.params.id
    let user = await getUser(id)
    if (!user) user = await autoCreateUser(id)

    // Check username uniqueness if changing
    if (req.body.username && req.body.username !== user.username) {
      if (mode === 'postgres') {
        const { rows } = await query('SELECT id FROM users WHERE username = $1 AND id != $2 LIMIT 1', [req.body.username, id])
        if (rows.length > 0) return res.status(409).json({ error: 'username_taken' })
      }
    }

    const updated = await updateUser(id, req.body)
    res.json(updated)
  } catch (e) {
    // Postgres unique violation
    if (e.code === '23505') return res.status(409).json({ error: 'username_taken' })
    next(e)
  }
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

// Check if username is available
r.get('/check/username/:username', async (req, res, next) => {
  try {
    if (mode !== 'postgres') return res.json({ available: true })
    const { rows } = await query('SELECT id FROM users WHERE username = $1 LIMIT 1', [req.params.username])
    res.json({ available: rows.length === 0 })
  } catch (e) { next(e) }
})

// Lookup email by username (for login-by-username)
r.get('/lookup/email/:username', async (req, res, next) => {
  try {
    if (mode !== 'postgres') return res.status(404).json({ error: 'not_found' })
    const { rows } = await query('SELECT email FROM users WHERE username = $1 LIMIT 1', [req.params.username])
    if (!rows[0]?.email) return res.status(404).json({ error: 'not_found' })
    res.json({ email: rows[0].email })
  } catch (e) { next(e) }
})

async function autoCreateUser(id, req) {
  const email = req?.user?.email || null
  // Use preferred_username from Cognito, or email prefix, or short ID
  let username = req?.user?.username || null
  // If username looks like an email or UUID, derive a better one
  if (!username || username.includes('@') || username.length > 30) {
    username = email ? email.split('@')[0] : `op_${id.slice(0, 6)}`
  }
  const u = { id, username, email, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0, matches_watched: 0, prediction_title: 'Rookie' }
  return await createUser(u)
}

export default r
