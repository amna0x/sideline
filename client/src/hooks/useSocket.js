import { useEffect, useRef } from 'react'
import { getSocket } from '../lib/socket.js'

export function useSocket(events = {}) {
  const handlers = useRef(events)
  handlers.current = events

  useEffect(() => {
    const s = getSocket()
    const wrapped = {}
    for (const ev of Object.keys(handlers.current)) {
      wrapped[ev] = (...args) => handlers.current[ev]?.(...args)
      s.on(ev, wrapped[ev])
    }
    return () => { for (const ev of Object.keys(wrapped)) s.off(ev, wrapped[ev]) }
  }, [])

  return getSocket()
}
