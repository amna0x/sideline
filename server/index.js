import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server as SocketServer } from 'socket.io'

import matchesRouter from './routes/matches.js'
import predictionsRouter from './routes/predictions.js'
import usersRouter from './routes/users.js'
import vaultRouter from './routes/vault.js'
import leaderboardRouter from './routes/leaderboard.js'
import quizRouter from './routes/quiz.js'
import { registerSocketHandlers } from './socket/handlers.js'
import { startSimulator } from './simulator/engine.js'

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

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

const server = http.createServer(app)
const io = new SocketServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' }
})

registerSocketHandlers(io)
app.set('io', io)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`[sideline] http+ws on :${PORT}`)
  if (process.env.AUTO_SIMULATE === '1') startSimulator(io)
})
