import { Router } from 'express'
import { z } from 'zod'
import { supabase, ready } from '../db/supabase.js'
import { db } from '../db/memory.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { getPlayerPhotoUrl, getTeamLogoUrl } from '../services/sofascore.js'

const r = Router()

const redeemSchema = z.object({ user_vault_id: z.string().min(1).max(64) })

const purchaseSchema = z.object({ vault_item_id: z.string().min(1).max(64) })

function resolveVaultItemImages(item) {
  // Visuals are now generated client-side per tier (see VaultCard.jsx).
  // Keep the helper as a passthrough so callers don't break if we later want
  // to inject promo art for specific items.
  return item
}

r.get('/items', async (_, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('vault_items').select('*').order('points_cost')
      if (error) throw error
      return res.json((data || []).map(resolveVaultItemImages))
    }
    const items = [...db.vault_items.values()]
      .sort((a, b) => (a.points_cost || 0) - (b.points_cost || 0))
      .map(resolveVaultItemImages)
    res.json(items)
  } catch (e) { next(e) }
})

r.get('/user/:id', async (req, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('user_vault').select('*, vault_items(*)').eq('user_id', req.params.id)
      if (error) throw error
      return res.json((data || []).map((row) => {
        const resolvedItem = resolveVaultItemImages(row.vault_items);
        return { ...row, ...resolvedItem, vault_item_id: row.vault_item_id, id: row.id };
      }))
    }
    const out = db.user_vault.filter((v) => v.user_id === req.params.id).map((row) => {
      const rawItem = db.vault_items.get(row.vault_item_id);
      const resolvedItem = resolveVaultItemImages(rawItem);
      return { ...resolvedItem, ...row };
    })
    res.json(out)
  } catch (e) { next(e) }
})

r.post('/redeem', writeLimiter, requireAuth, validate({ body: redeemSchema }), async (req, res, next) => {  try {
    const userId = req.user.id
    const { user_vault_id } = req.body
    const code = `ADIDAS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    if (ready) {
      const { data, error } = await supabase.from('user_vault')
        .update({ redeemed: true, code })
        .eq('id', user_vault_id).eq('user_id', userId)
        .select().single()
      if (error) throw error
      if (!data) return res.status(404).json({ error: 'not found' })
      return res.json({ ok: true, code })
    }
    const row = db.user_vault.find((v) => v.id === user_vault_id && v.user_id === userId)
    if (!row) return res.status(404).json({ error: 'not found' })
    row.redeemed = true; row.code = code
    res.json({ ok: true, code })
  } catch (e) { next(e) }
})

// Buy a vault item with XP. Deducts points_total atomically with the mint.
// Returns the new user_vault row + remaining balance so the client can update state.
r.post('/purchase', writeLimiter, requireAuth, validate({ body: purchaseSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id
    const { vault_item_id } = req.body

    if (ready) {
      const { data: item, error: itemErr } = await supabase.from('vault_items').select('*').eq('id', vault_item_id).single()
      if (itemErr || !item) return res.status(404).json({ error: 'item_not_found' })
      if ((item.remaining_supply ?? 0) <= 0) return res.status(409).json({ error: 'sold_out' })

      const { data: user, error: userErr } = await supabase.from('users').select('points_total').eq('id', userId).single()
      if (userErr) throw userErr
      const balance = user?.points_total || 0
      const cost = item.points_cost || 0
      if (balance < cost) return res.status(402).json({ error: 'insufficient_points', need: cost - balance })

      const { data: existing } = await supabase.from('user_vault').select('id').eq('user_id', userId).eq('vault_item_id', vault_item_id).limit(1)
      if (existing && existing.length > 0) return res.status(409).json({ error: 'already_owned' })

      const record = { id: `uv_${userId.slice(0, 6)}_${vault_item_id}_${Date.now()}`, user_id: userId, vault_item_id, earned_at: new Date().toISOString(), redeemed: false }
      const { error: insErr } = await supabase.from('user_vault').insert(record)
      if (insErr) throw insErr
      await supabase.from('vault_items').update({ remaining_supply: item.remaining_supply - 1 }).eq('id', vault_item_id)
      const newBalance = balance - cost
      await supabase.from('users').update({ points_total: newBalance }).eq('id', userId)

      const io = req.app.get('io')
      if (io) {
        io.emit('vault:supply_update', { vault_item_id, remaining_supply: item.remaining_supply - 1 })
        io.to(`user:${userId}`).emit('vault:minted', record)
      }
      return res.json({ ok: true, points_total: newBalance, user_vault: record })
    }

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
