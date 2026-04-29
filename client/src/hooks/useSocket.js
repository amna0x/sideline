import { useEffect, useRef, useState } from 'react'
import { getSocket } from '../lib/socket.js'

export function useSocket(events = {}) {
  const handlers = useRef(events)
  handlers.current = events
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    let cancelled = false
    let bound = []
    let s

    getSocket().then((sock) => {
      if (cancelled) return
      s = sock
      setSocket(sock)
      for (const ev of Object.keys(handlers.current)) {
        const fn = (...args) => handlers.current[ev]?.(...args)
        sock.on(ev, fn)
        bound.push([ev, fn])
      }
    })

    return () => {
      cancelled = true
      if (s) for (const [ev, fn] of bound) s.off(ev, fn)
    }
  }, [])

  return socket
}
