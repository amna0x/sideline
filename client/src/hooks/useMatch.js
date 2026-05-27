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
  const pushNotification = useStore((s) => s.pushNotification)
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
    'match:event': (ev) => {
      pushEvent(ev)
      if (ev.type === 'goal') {
        pushNotification({
          type: 'goal',
          title: `GOAL! ${ev.player_name}`,
          message: `${ev.minute}' — ${ev.team === 'home' ? 'Home' : 'Away'} scores!`,
          icon: '⚽',
          duration: 5000
        })
      }
    },
    'match:pulse': (zones) => setPulse(zones),
    'demo:adidas_drop': (drop) => setPendingDrop(drop),
    'match:goal': (drop) => {
      // Only show a notification for goals, no full-screen overlay
      pushNotification({
        type: 'goal',
        title: `${drop.rarity} MOMENT`,
        message: `${drop.player_name} ${drop.minute}'`,
        icon: '⚽',
        duration: 4000
      })
    }
  })

  useEffect(() => {
    const t = setInterval(() => { if (match?.id) api.match(match.id).then(setMatch).catch(() => {}) }, 30000)
    return () => clearInterval(t)
  }, [match?.id, setMatch])

  return { match, loading, error, reload: load }
}
