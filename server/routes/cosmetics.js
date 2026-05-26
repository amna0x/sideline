import { Router } from 'express'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'
import { getUser, updateUser } from '../db/index.js'
import { isAdmin } from './helpers.js'

const r = Router()

// Get all available cosmetics
r.get('/', async (req, res, next) => {
  try {
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query('SELECT * FROM cosmetics ORDER BY xp_cost ASC')
    res.json(rows)
  } catch (e) { next(e) }
})

// Get user's purchased cosmetics
r.get('/user/:userId', async (req, res, next) => {
  try {
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query(
      `SELECT uc.*, c.name, c.type, c.description, c.preview_url, c.tier
       FROM user_cosmetics uc JOIN cosmetics c ON c.id = uc.cosmetic_id
       WHERE uc.user_id = $1`,
      [req.params.userId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Purchase a cosmetic
r.post('/purchase', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { cosmetic_id } = req.body
    if (!cosmetic_id) return res.status(400).json({ error: 'missing_cosmetic_id' })
    if (mode !== 'postgres') return res.status(501).json({ error: 'not_available' })

    // Get cosmetic
    const { rows: [cosmetic] } = await query('SELECT * FROM cosmetics WHERE id = $1', [cosmetic_id])
    if (!cosmetic) return res.status(404).json({ error: 'cosmetic_not_found' })

    // Check if already owned
    const { rows: owned } = await query(
      'SELECT id FROM user_cosmetics WHERE user_id = $1 AND cosmetic_id = $2',
      [userId, cosmetic_id]
    )
    if (owned.length > 0) return res.status(400).json({ error: 'already_owned' })

    // Check XP (admins bypass)
    const user = await getUser(userId)
    if (!isAdmin(req.user) && (!user || (user.points_total || 0) < cosmetic.xp_cost)) {
      return res.status(400).json({ error: 'insufficient_xp', required: cosmetic.xp_cost, current: user?.points_total || 0 })
    }

    // Deduct XP (skip for admins) — update with RETURNING so we have authoritative value
    let newBalance = user?.points_total || 0
    if (!isAdmin(req.user)) {
      const { rows } = await query('UPDATE users SET points_total = points_total - $1 WHERE id = $2 RETURNING points_total', [cosmetic.xp_cost, userId])
      newBalance = rows[0]?.points_total ?? newBalance - cosmetic.xp_cost
    }

    await query(
      'INSERT INTO user_cosmetics (user_id, cosmetic_id) VALUES ($1, $2)',
      [userId, cosmetic_id]
    )

    // Emit socket update and return authoritative balance
    const io = req.app.get('io')
    if (io) io.to(`user:${userId}`).emit('user:points_updated', { userId, points_total: newBalance })
    res.json({ ok: true, new_balance: newBalance })
  } catch (e) { next(e) }
})

// Equip/unequip a cosmetic
r.post('/equip', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { cosmetic_id, equipped } = req.body
    if (!cosmetic_id) return res.status(400).json({ error: 'missing_cosmetic_id' })
    if (mode !== 'postgres') return res.status(501).json({ error: 'not_available' })

    // Get cosmetic type to unequip others of same type
    const { rows: [cosmetic] } = await query('SELECT type FROM cosmetics WHERE id = $1', [cosmetic_id])
    if (!cosmetic) return res.status(404).json({ error: 'not_found' })

    if (equipped) {
      // Unequip others of same type first
      await query(
        `UPDATE user_cosmetics SET equipped = false
         WHERE user_id = $1 AND cosmetic_id IN (SELECT id FROM cosmetics WHERE type = $2)`,
        [userId, cosmetic.type]
      )
    }

    await query(
      'UPDATE user_cosmetics SET equipped = $1 WHERE user_id = $2 AND cosmetic_id = $3',
      [equipped !== false, userId, cosmetic_id]
    )

    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Check if user has GIF unlock (admins always have it)
r.get('/has-gif/:userId', async (req, res, next) => {
  try {
    if (mode !== 'postgres') return res.json({ unlocked: false })
    // Check if admin
    const { rows: userRows } = await query('SELECT username, email FROM users WHERE id = $1', [req.params.userId])
    const u = userRows[0]
    if (u && isAdmin({ username: u.username, email: u.email })) {
      return res.json({ unlocked: true })
    }
    const { rows } = await query(
      "SELECT id FROM user_cosmetics WHERE user_id = $1 AND cosmetic_id = 'gif_unlock'",
      [req.params.userId]
    )
    res.json({ unlocked: rows.length > 0 })
  } catch (e) { next(e) }
})

export default r
