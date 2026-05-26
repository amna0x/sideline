import { io } from 'socket.io-client'
import { getIdToken } from './cognito.js'
import { loadGuestSession } from './session.js'

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let socket = null

async function buildAuth() {
  const token = await getIdToken().catch(() => null)
  if (token) return { token }
  const guest = loadGuestSession()
  if (guest?.user?.id) return { userId: guest.user.id, username: guest.user.user_metadata?.username || 'Guest' }
  return {}
}

export async function getSocket() {
  if (socket?.connected) return socket
  // If socket exists but disconnected, clean it up
  if (socket) { socket.disconnect(); socket = null }
  const auth = await buildAuth()
  socket = io(URL, { autoConnect: true, transports: ['websocket', 'polling'], auth })
  socket.on('connect', () => console.log('[socket] connected', socket.id))
  socket.on('disconnect', (reason) => console.log('[socket] disconnect', reason))
  socket.on('connect_error', (err) => console.warn('[socket] error', err.message))
  return socket
}

export function reconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}
