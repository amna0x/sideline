import 'dotenv/config'
import http from 'http'
import { Server as SocketServer } from 'socket.io'

import { createApp } from './app.js'
import { registerSocketHandlers } from './socket/handlers.js'
import { startSimulator } from './simulator/engine.js'

const app = createApp()
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
