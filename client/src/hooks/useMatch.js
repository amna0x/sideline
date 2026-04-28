import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'
import { useSocket } from './useSocket.js'

export function useMatch() {
  const match = useStore((s) => s.match)
  const setMatch = useStore((s) => s.setMatch)
  const pushEvent = useStore((s) => s.pushEvent)
  const setPulse = useStore((s) => s.setPulse)
  const setPendingDrop = useStore((s) => s.setPendingDrop)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      let m = await api.liveMatch().catch(() => null)
      if (!m) m = await api.upcomingMatch().catch(() => null)
      setMatch(m)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useSocket({
    'match:update': (payload) => setMatch(payload),
    'match:event': (ev) => pushEvent(ev),
    'match:pulse': (zones) => setPulse(zones),
    'match:goal': (drop) => setPendingDrop(drop)
  })

  // poll every 30s as fallback
  useEffect(() => {
    const t = setInterval(() => { if (match?.id) api.match(match.id).then(setMatch).catch(() => {}) }, 30000)
    return () => clearInterval(t)
  }, [match?.id, setMatch])

  return { match, loading, error, reload: load }
}
