import { Router } from 'express'
import { z } from 'zod'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const r = Router()

const addSchema = z.object({ friend_id: z.string().min(1).max(64) })

// Get my friends list
r.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query(
      `SELECT f.*, u.username, u.avatar_url, u.tier, u.points_total
       FROM friends f
       JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'`,
      [userId]
    )
    res.json(rows.map((r) => ({
      id: r.friend_id === userId ? r.user_id : r.friend_id,
      username: r.username,
      avatar_url: r.avatar_url,
      tier: r.tier,
      points_total: r.points_total
    })))
  } catch (e) { next(e) }
})

// Get pending friend requests (received)
r.get('/requests', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query(
      `SELECT f.id as request_id, f.user_id as from_id, u.username, u.avatar_url, f.created_at
       FROM friends f JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Get outgoing friend requests (sent by me)
r.get('/requests/outgoing', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query(
      `SELECT f.id as request_id, f.friend_id as to_id, u.username, u.avatar_url, f.created_at
       FROM friends f JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// Send friend request
r.post('/add', writeLimiter, requireAuth, validate({ body: addSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { friend_id } = req.body
    if (userId === friend_id) return res.status(400).json({ error: 'cannot_add_self' })
    if (mode !== 'postgres') return res.json({ ok: true })

    // Check if already friends or pending
    const { rows: existing } = await query(
      `SELECT * FROM friends WHERE
        (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friend_id]
    )
    if (existing.length > 0) {
      const f = existing[0]
      if (f.status === 'accepted') return res.status(400).json({ error: 'already_friends' })
      if (f.status === 'pending') return res.status(400).json({ error: 'request_pending' })
    }

    await query(
      'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, friend_id, 'pending']
    )
    // Notify the recipient via socket
    const io = req.app.get('io')
    if (io) io.to(`user:${friend_id}`).emit('friend:request_received', { from: userId, username: req.user.username })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Accept friend request
r.post('/accept', writeLimiter, requireAuth, validate({ body: z.object({ request_id: z.string() }) }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { request_id } = req.body
    if (mode !== 'postgres') return res.json({ ok: true })

    const { rows } = await query(
      "UPDATE friends SET status = 'accepted' WHERE id = $1 AND friend_id = $2 AND status = 'pending' RETURNING *",
      [request_id, userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'request_not_found' })
    // Notify the sender their request was accepted
    const io = req.app.get('io')
    if (io) io.to(`user:${rows[0].user_id}`).emit('friend:request_accepted', { by: userId, username: req.user.username })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Decline friend request (incoming) or cancel (outgoing)
r.post('/decline', writeLimiter, requireAuth, validate({ body: z.object({ request_id: z.string() }) }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { request_id } = req.body
    if (mode !== 'postgres') return res.json({ ok: true })

    const { rows } = await query(
      "DELETE FROM friends WHERE id = $1 AND (friend_id = $2 OR user_id = $2) AND status = 'pending' RETURNING *",
      [request_id, userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'request_not_found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Remove friend
r.delete('/:friendId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    if (mode !== 'postgres') return res.status(204).end()
    await query(
      'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, req.params.friendId]
    )
    res.status(204).end()
  } catch (e) { next(e) }
})

// Search users (for adding friends)
r.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = req.query.q
    if (!q || q.length < 2) return res.json([])
    if (mode !== 'postgres') return res.json([])
    const { rows } = await query(
      "SELECT id, username, avatar_url, tier FROM users WHERE username ILIKE $1 LIMIT 10",
      [`%${q}%`]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

export default r
