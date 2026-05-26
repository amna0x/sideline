// Admin utility routes for XP adjustments and bulk vault minting.
// Access is restricted inside the route via isAdmin().

import { Router } from 'express'
import { z } from 'zod'
import { mode, getUser, createUser, updateUser, getVaultItems } from '../db/index.js'
import { query } from '../db/postgres.js'
import { db } from '../db/memory.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { isAdmin } from './helpers.js'

const r = Router()

const grantSchema = z.object({
  user_id: z.string().min(1).max(64),
  points: z.number().int().min(-1_000_000).max(1_000_000).optional().default(0),
  vault_all: z.boolean().optional().default(false)
}).strict()

r.post('/grant', requireAuth, validate({ body: grantSchema }), async (req, res, next) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'admin_only' })
    const { user_id, points, vault_all } = req.body

    // Ensure user exists
    let user = await getUser(user_id)
    if (!user) {
      user = await createUser({ id: user_id, username: `dev_${user_id.slice(0, 6)}`, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0, matches_watched: 0, prediction_title: 'Rookie' })
    }

    // Adjust points (allow positive or negative, clamp at zero)
    if (points) {
      if (mode === 'postgres') {
        const { rows } = await query(
          'UPDATE users SET points_total = GREATEST(COALESCE(points_total, 0) + $1, 0) WHERE id = $2 RETURNING *',
          [points, user_id]
        )
        if (!rows[0]) {
          await createUser({ id: user_id, username: `dev_${user_id.slice(0, 6)}`, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0, matches_watched: 0, prediction_title: 'Rookie' })
          const { rows: afterCreate } = await query(
            'UPDATE users SET points_total = GREATEST(COALESCE(points_total, 0) + $1, 0) WHERE id = $2 RETURNING *',
            [points, user_id]
          )
          user = afterCreate[0] || await getUser(user_id)
        } else {
          user = rows[0]
        }
      } else {
        const newTotal = Math.max(0, (user.points_total || 0) + points)
        await updateUser(user_id, { points_total: newTotal })
        user.points_total = newTotal
      }
    }

    // Grant all vault items
    let granted = []
    if (vault_all) {
      const items = await getVaultItems()
      for (const item of items) {
        if (mode === 'postgres') {
          const { rows: existing } = await query('SELECT id FROM user_vault WHERE user_id = $1 AND vault_item_id = $2', [user_id, item.id])
          if (existing.length > 0) continue
          await query('INSERT INTO user_vault (user_id, vault_item_id, earned_at) VALUES ($1, $2, NOW())', [user_id, item.id])
          granted.push(item.id)
        } else {
          const exists = db.user_vault.some(v => v.user_id === user_id && v.vault_item_id === item.id)
          if (exists) continue
          db.user_vault.push({ id: `uv_${user_id.slice(0, 6)}_${item.id}_${Date.now()}`, user_id, vault_item_id: item.id, earned_at: new Date().toISOString(), redeemed: false })
          granted.push(item.id)
        }
      }
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`user:${user_id}`).emit('leaderboard:update')
      io.to(`user:${user_id}`).emit('user:points_updated', { userId: user_id, points_total: user.points_total })
    }

    res.json({ ok: true, points_total: user.points_total, granted_count: granted.length, granted })
  } catch (e) { next(e) }
})

export default r
