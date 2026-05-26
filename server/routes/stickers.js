import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const r = Router()
const STIPOP_BASE = 'https://messenger.stipop.io/v1'
const STIPOP_KEY = process.env.STIPOP_API_KEY

if (!STIPOP_KEY) {
  console.warn('[stickers] STIPOP_API_KEY not set — sticker routes will return empty')
}

async function stipopFetch(path) {
  if (!STIPOP_KEY) return null
  const res = await fetch(`${STIPOP_BASE}${path}`, {
    headers: { apikey: STIPOP_KEY }
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.header?.code !== '0000') return null
  return data.body
}

// Get trending sticker packs
r.get('/packs', requireAuth, async (req, res, next) => {
  try {
    const page = req.query.page || 1
    const userId = req.user.id
    const body = await stipopFetch(`/package?userId=${userId}&pageNumber=${page}&limit=12`)
    if (!body) return res.json([])
    const packs = (body.packageList || []).map((p) => ({
      id: p.packageId,
      name: p.packageName,
      img: p.packageImg,
      img45: p.packageImg_45,
      category: p.packageCategory,
      animated: p.packageAnimated === 'Y',
      artist: p.artistName
    }))
    res.json(packs)
  } catch (e) { next(e) }
})

// Get stickers in a pack
r.get('/packs/:packId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const body = await stipopFetch(`/package/${req.params.packId}?userId=${userId}`)
    if (!body?.package?.stickers) return res.json([])
    const stickers = body.package.stickers.map((s) => ({
      id: s.stickerId,
      img: s.stickerImg_200 || s.stickerImg,
      imgFull: s.stickerImg
    }))
    res.json(stickers)
  } catch (e) { next(e) }
})

// Search stickers
r.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = req.query.q
    if (!q || q.length < 2) return res.json([])
    const userId = req.user.id
    const body = await stipopFetch(`/search?userId=${userId}&q=${encodeURIComponent(q)}&pageNumber=1&limit=20`)
    if (!body?.stickerList) return res.json([])
    const stickers = body.stickerList.map((s) => ({
      id: s.stickerId,
      img: s.stickerImg_200 || s.stickerImg,
      imgFull: s.stickerImg,
      packId: s.packageId
    }))
    res.json(stickers)
  } catch (e) { next(e) }
})

export default r
