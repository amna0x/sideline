import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

function userKey(req, res) {
  return req.user?.id || ipKeyGenerator(req, res)
}

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: 'rate_limited' }
})

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: 'rate_limited' }
})

export function makeLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max: isTest ? max * 100 : max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: userKey,
    message: { error: 'rate_limited' }
  })
}
