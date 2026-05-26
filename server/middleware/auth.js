// Auth middleware. Verifies AWS Cognito JWTs (when configured) and attaches
// req.user. Falls back to a header-based guest identity for local demos.

import { verifyToken, cognitoReady } from './cognito.js'

const BEARER = /^Bearer\s+(.+)$/i

function extractToken(req) {
  const header = req.headers.authorization || ''
  const m = header.match(BEARER)
  return m ? m[1].trim() : null
}

function guestFrom(req) {
  const fallback = req.headers['x-user-id'] || req.body?.user_id
  if (!fallback) return null
  return { id: String(fallback), guest: true }
}

export async function requireAuth(req, res, next) {
  try {
    if (!cognitoReady) {
      // Local dev only — trust x-user-id header for demos
      const guest = guestFrom(req)
      if (!guest) return res.status(401).json({ error: 'unauthorized' })
      req.user = guest
      return next()
    }
    // Production: Cognito token required, no guest fallback
    const token = extractToken(req)
    const user = token ? await verifyToken(token) : null
    if (!user) return res.status(401).json({ error: 'unauthorized' })
    req.user = user
    next()
  } catch (e) { next(e) }
}

export async function optionalAuth(req, _res, next) {
  try {
    if (!cognitoReady) {
      req.user = guestFrom(req)
      return next()
    }
    const token = extractToken(req)
    req.user = token ? await verifyToken(token) : null
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
