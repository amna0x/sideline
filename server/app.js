import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import matchesRouter from './routes/matches.js'
import predictionsRouter from './routes/predictions.js'
import usersRouter from './routes/users.js'
import vaultRouter from './routes/vault.js'
import leaderboardRouter from './routes/leaderboard.js'
import quizRouter from './routes/quiz.js'
import squadRouter from './routes/squad.js'
import friendsRouter from './routes/friends.js'
import shareRouter from './routes/share.js'
import devRouter from './routes/dev.js'
import authRouter from './routes/auth.js'
import cosmeticsRouter from './routes/cosmetics.js'
import stickersRouter from './routes/stickers.js'
import adminRouter from './routes/admin.js'
import { apiLimiter } from './middleware/rateLimit.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer-when-downgrade' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': ["'self'", 'https:', 'wss:', 'ws:'],
        'frame-ancestors': ["'none'"]
      }
    }
  }))
  const corsOrigin = process.env.CORS_ORIGIN || '*'
  app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()) }))
  app.use(express.json({ limit: '256kb' }))
  app.use('/api', apiLimiter)

  app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

  app.use('/api/matches', matchesRouter)
  app.use('/api/predictions', predictionsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/vault', vaultRouter)
  app.use('/api/leaderboard', leaderboardRouter)
  app.use('/api/quiz', quizRouter)
  app.use('/api/squad', squadRouter)
  app.use('/api/friends', friendsRouter)
  app.use('/api/share', shareRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/cosmetics', cosmeticsRouter)
  app.use('/api/stickers', stickersRouter)
  app.use('/api/admin', adminRouter)
  if (process.env.DEV_TOOLS === '1') {
    app.use('/api/dev', devRouter)
    console.log('[app] dev routes enabled at /api/dev (DEV_TOOLS=1)')
  }

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(err.status || 500).json({ error: err.message || 'internal_error' })
  })

  return app
}
