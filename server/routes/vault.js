import { Router } from 'express'
import { z } from 'zod'
import { mode, getVaultItems, getUserVault } from '../db/index.js'
import { query } from '../db/postgres.js'
import { db } from '../db/memory.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const r = Router()

const redeemSchema = z.object({ user_vault_id: z.string().min(1).max(64) })
const purchaseSchema = z.object({ vault_item_id: z.string().min(1).max(64) })

function resolveVaultItemImages(item) {
  return item
}

r.get('/items', async (_, res, next) => {
  try {
    const items = await getVaultItems()
    res.json(items.map(resolveVaultItemImages))
  } catch (e) { next(e) }
})

r.get('/user/:id', async (req, res, next) => {
  try {
    const vault = await getUserVault(req.params.id)
    res.json(vault.map(resolveVaultItemImages))
  } catch (e) { next(e) }
})

r.post('/redeem', writeLimiter, requireAuth, validate({ body: redeemSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { user_vault_id } = req.body
    const code = `ADIDAS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    if (mode === 'postgres') {
      const { rows } = await query(
        'UPDATE user_vault SET redeemed = true, code = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [code, user_vault_id, userId]
      )
      if (!rows[0]) return res.status(404).json({ error: 'not found' })
      return res.json({ ok: true, code })
    }

    const row = db.user_vault.find((v) => v.id === user_vault_id && v.user_id === userId)
    if (!row) return res.status(404).json({ error: 'not found' })
    row.redeemed = true; row.code = code
    res.json({ ok: true, code })
  } catch (e) { next(e) }
})

r.post('/purchase', writeLimiter, requireAuth, validate({ body: purchaseSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { vault_item_id } = req.body

    if (mode === 'postgres') {
      const { rows: items } = await query('SELECT * FROM vault_items WHERE id = $1', [vault_item_id])
      const item = items[0]
      if (!item) return res.status(404).json({ error: 'item_not_found' })
      if ((item.remaining_supply ?? 0) <= 0) return res.status(409).json({ error: 'sold_out' })

      const { rows: users } = await query('SELECT points_total FROM users WHERE id = $1', [userId])
      const balance = users[0]?.points_total || 0
      const cost = item.points_cost || 0
      if (balance < cost) return res.status(402).json({ error: 'insufficient_points', need: cost - balance })

      const { rows: existing } = await query('SELECT id FROM user_vault WHERE user_id = $1 AND vault_item_id = $2 LIMIT 1', [userId, vault_item_id])
      if (existing.length > 0) return res.status(409).json({ error: 'already_owned' })

      await query('UPDATE vault_items SET remaining_supply = remaining_supply - 1 WHERE id = $1', [vault_item_id])
      const newBalance = balance - cost
      await query('UPDATE users SET points_total = $1 WHERE id = $2', [newBalance, userId])
      const { rows: inserted } = await query(
        'INSERT INTO user_vault (user_id, vault_item_id, earned_at) VALUES ($1, $2, NOW()) RETURNING *',
        [userId, vault_item_id]
      )
      const record = inserted[0]

      const io = req.app.get('io')
      if (io) {
        io.emit('vault:supply_update', { vault_item_id, remaining_supply: item.remaining_supply - 1 })
        io.to(`user:${userId}`).emit('vault:minted', record)
        io.to(`user:${userId}`).emit('user:points_updated', { userId, points_total: newBalance })
      }
      return res.json({ ok: true, points_total: newBalance, user_vault: record })
    }

    // Memory mode
    const item = db.vault_items.get(vault_item_id)
    if (!item) return res.status(404).json({ error: 'item_not_found' })
    if ((item.remaining_supply ?? 0) <= 0) return res.status(409).json({ error: 'sold_out' })

    const user = db.users.get(userId) || { id: userId, username: `op_${userId.slice(0, 6)}`, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0 }
    const cost = item.points_cost || 0
    if ((user.points_total || 0) < cost) return res.status(402).json({ error: 'insufficient_points', need: cost - (user.points_total || 0) })
    if (db.user_vault.some((v) => v.user_id === userId && v.vault_item_id === vault_item_id)) return res.status(409).json({ error: 'already_owned' })

    user.points_total = (user.points_total || 0) - cost
    db.users.set(userId, user)
    item.remaining_supply -= 1
    const record = { id: `uv_${userId.slice(0, 6)}_${vault_item_id}_${Date.now()}`, user_id: userId, vault_item_id, earned_at: new Date().toISOString(), redeemed: false }
    db.user_vault.push(record)

    const io = req.app.get('io')
    if (io) {
      io.emit('vault:supply_update', { vault_item_id, remaining_supply: item.remaining_supply })
      io.to(`user:${userId}`).emit('vault:minted', record)
    }
    res.json({ ok: true, points_total: user.points_total, user_vault: record })
  } catch (e) { next(e) }
})

export default r
