// Dev-only routes. Mounted in app.js when DEV_TOOLS=1 in env.
// Lets you grant XP and bulk-mint vault items to a user without going through
// the simulator. Never enable this in production.

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/memory.js'
import { supabase, ready } from '../db/supabase.js'
import { validate } from '../middleware/validate.js'

const r = Router()

const grantSchema = z.object({
  user_id: z.string().min(1).max(64),
  points: z.number().int().min(0).max(1_000_000).optional().default(0),
  vault_all: z.boolean().optional().default(false)
}).strict()

r.post('/grant', validate({ body: grantSchema }), async (req, res, next) => {
  try {
    const { user_id, points, vault_all } = req.body

    let user
    if (ready) {
      const { data, error } = await supabase.from('users').select('*').eq('id', user_id).single()
      if (error && error.code !== 'PGRST116') throw error
      user = data
      if (!user) {
        const insert = { id: user_id, username: `dev_${user_id.slice(0, 6)}`, tier: 'fan', points_total: 0 }
        const { data: created, error: insErr } = await supabase.from('users').insert(insert).select().single()
        if (insErr) throw insErr
        user = created
      }
    } else {
      user = db.users.get(user_id) || { id: user_id, username: `dev_${user_id.slice(0, 6)}`, tier: 'fan', points_total: 0, predictions_made: 0, predictions_correct: 0 }
      db.users.set(user_id, user)
    }

    if (points) {
      user.points_total = (user.points_total || 0) + points
      if (ready) await supabase.from('users').update({ points_total: user.points_total }).eq('id', user_id)
      else db.users.set(user_id, user)
    }

    let granted = []
    if (vault_all) {
      const items = ready
        ? (await supabase.from('vault_items').select('*')).data || []
        : [...db.vault_items.values()]

      for (const item of items) {
        const record = {
          id: `uv_${user_id.slice(0, 6)}_${item.id}_${Date.now()}`,
          user_id,
          vault_item_id: item.id,
          earned_at: new Date().toISOString(),
          redeemed: false
        }
        if (ready) {
          const { error } = await supabase.from('user_vault').insert(record)
          if (!error) granted.push(item.id)
        } else {
          db.user_vault.push(record)
          granted.push(item.id)
        }
      }
    }

    const io = req.app.get('io')
    if (io) io.to(`user:${user_id}`).emit('leaderboard:update')

    res.json({ ok: true, points_total: user.points_total, granted_count: granted.length, granted })
  } catch (e) { next(e) }
})

export default r
