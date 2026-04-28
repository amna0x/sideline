import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let socket = null

export function getSocket() {
  if (socket) return socket
  socket = io(URL, { autoConnect: true, transports: ['websocket', 'polling'] })
  socket.on('connect', () => console.log('[socket] connected', socket.id))
  socket.on('disconnect', (reason) => console.log('[socket] disconnect', reason))
  socket.on('connect_error', (err) => console.warn('[socket] error', err.message))
  return socket
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}
