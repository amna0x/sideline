// Standalone runner — connects to a running server via socket.io-client.
// Use this if you want to run sim against a deployed server, or for repeat demos.
// For local dev set AUTO_SIMULATE=1 in .env so the engine runs in-process.

import 'dotenv/config'
import { io as ioClient } from 'socket.io-client'

const url = process.env.SOCKET_URL || `http://localhost:${process.env.PORT || 4000}`
const socket = ioClient(url)
socket.on('connect', () => {
  console.log('[sim-runner] connected', socket.id)
  // Trigger server-side start via custom emit
  socket.emit('admin:simulate:start')
})
