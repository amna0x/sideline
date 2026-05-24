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

function resolveVaultItemImages(item) {
  if (!item) return item;
  const copy = { ...item };
  if (!copy.image_url) {
    if (copy.type === 'adidas_card' || copy.type === 'collectible') {
      if (copy.name.toLowerCase().includes('brandt')) {
        copy.image_url = getPlayerPhotoUrl('Julian Brandt');
      } else if (copy.name.toLowerCase().includes('adeyemi')) {
        copy.image_url = getPlayerPhotoUrl('Karim Adeyemi');
      } else {
        copy.image_url = getPlayerPhotoUrl('Harry Kane');
      }
    } else if (copy.type === 'badge') {
      copy.image_url = getTeamLogoUrl('Borussia Dortmund');
    }
  }
  return copy;
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

r.post('/redeem', writeLimiter, requireAuth, validate({ body: redeemSchema }), async (req, res, next) => {
  try {
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

export default r
