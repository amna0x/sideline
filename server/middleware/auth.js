import { supabase, ready } from '../db/supabase.js'

const BEARER = /^Bearer\s+(.+)$/i

function extractToken(req) {
  const header = req.headers.authorization || ''
  const m = header.match(BEARER)
  return m ? m[1].trim() : null
}

async function resolveUser(token) {
  if (!ready || !token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

export async function requireAuth(req, res, next) {
  try {
    if (!ready) {
      const fallback = req.headers['x-user-id'] || req.body?.user_id
      if (!fallback) return res.status(401).json({ error: 'unauthorized' })
      req.user = { id: String(fallback), guest: true }
      return next()
    }
    const token = extractToken(req)
    const user = await resolveUser(token)
    if (!user) return res.status(401).json({ error: 'unauthorized' })
    req.user = { id: user.id, email: user.email, metadata: user.user_metadata || {} }
    next()
  } catch (e) { next(e) }
}

export async function optionalAuth(req, _res, next) {
  try {
    if (!ready) {
      const fallback = req.headers['x-user-id'] || req.body?.user_id
      req.user = fallback ? { id: String(fallback), guest: true } : null
      return next()
    }
    const token = extractToken(req)
    const user = await resolveUser(token)
    req.user = user ? { id: user.id, email: user.email, metadata: user.user_metadata || {} } : null
    next()
  } catch (e) { next(e) }
}

export function requireSelf(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' })
    if (req.params[paramName] !== req.user.id) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}
