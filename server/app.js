import express from 'express'
import cors from 'cors'

import matchesRouter from './routes/matches.js'
import predictionsRouter from './routes/predictions.js'
import usersRouter from './routes/users.js'
import vaultRouter from './routes/vault.js'
import leaderboardRouter from './routes/leaderboard.js'
import quizRouter from './routes/quiz.js'
import { apiLimiter } from './middleware/rateLimit.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
  app.use(express.json({ limit: '256kb' }))
  app.use('/api', apiLimiter)

  app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

  app.use('/api/matches', matchesRouter)
  app.use('/api/predictions', predictionsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/vault', vaultRouter)
  app.use('/api/leaderboard', leaderboardRouter)
  app.use('/api/quiz', quizRouter)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(err.status || 500).json({ error: err.message || 'internal_error' })
  })

  return app
}
