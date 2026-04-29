import { io } from 'socket.io-client'
import { supabase } from './supabase.js'
import { loadGuestSession } from './session.js'

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let socket = null

async function buildAuth() {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) return { token: data.session.access_token }
  }
  const guest = loadGuestSession()
  if (guest?.user?.id) return { userId: guest.user.id }
  return {}
}

export async function getSocket() {
  if (socket) return socket
  const auth = await buildAuth()
  socket = io(URL, { autoConnect: true, transports: ['websocket', 'polling'], auth })
  socket.on('connect', () => console.log('[socket] connected', socket.id))
  socket.on('disconnect', (reason) => console.log('[socket] disconnect', reason))
  socket.on('connect_error', (err) => console.warn('[socket] error', err.message))
  return socket
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}
