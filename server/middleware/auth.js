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
      const guest = guestFrom(req)
      if (!guest) return res.status(401).json({ error: 'unauthorized' })
      req.user = guest
      return next()
    }
    const token = extractToken(req)
    const user = token ? await verifyToken(token) : null
    if (!user) {
      const guest = guestFrom(req)
      if (guest) {
        req.user = guest
        return next()
      }
      return res.status(401).json({ error: 'unauthorized' })
    }
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
    const user = token ? await verifyToken(token) : null
    req.user = user || guestFrom(req)
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
