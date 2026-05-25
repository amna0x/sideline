import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'
import { useSocket } from './useSocket.js'

export function usePredictions(matchId) {
  const [active, setActive] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const addPoints = useStore((s) => s.addPoints)
  const showToast = useStore((s) => s.showToast)
  const pushNotification = useStore((s) => s.pushNotification)

  const load = useCallback(async () => {
    if (!matchId) return
    setLoading(true); setError(null)
    try {
      const [a, u] = await Promise.all([
        api.activePredictions(matchId).catch(() => []),
        api.upcomingPredictions(matchId).catch(() => [])
      ])
      setActive(a || [])
      setUpcoming(u || [])
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [matchId])

  useEffect(() => { load() }, [load])

  useSocket({
    'prediction:new': (p) => {
      setActive((cur) => (cur.find((x) => x.id === p.id) ? cur : [...cur, p]))
      pushNotification({
        type: 'prediction',
        title: 'NEW PREDICTION',
        message: p.question,
        icon: '🎯',
        duration: 5000
      })
    },
    'prediction:resolved': ({ prediction_id, correct_answer, awards }) => {
      setActive((cur) => cur.map((p) => p.id === prediction_id ? { ...p, correct_answer, resolved_at: Date.now() } : p))
      if (awards && Array.isArray(awards)) {
        const mine = awards.find((a) => a.user_id === useStore.getState().user?.id)
        if (mine?.points_earned) {
          addPoints(mine.points_earned)
          pushNotification({
            type: 'xp',
            title: 'PREDICTION CORRECT',
            message: `Answer: ${correct_answer}`,
            points: mine.points_earned,
            icon: '⚡',
            duration: 4000
          })
        }
      }
    }
  })

  async function submit(prediction, option) {
    const userId = useStore.getState().user?.id
    if (!userId) throw new Error('not signed in')
    const opened = prediction.opens_at ? new Date(prediction.opens_at).getTime() : Date.now()
    // Clamp so the server's 10-minute speed_ms ceiling can't reject submits when
    // the page held a stale prediction (server restart, slow user, etc.).
    const speedMs = Math.max(0, Math.min(600000, Date.now() - opened))
    const result = await api.submitPrediction({
      user_id: userId,
      prediction_id: prediction.id,
      selected_option: option,
      speed_ms: speedMs
    })
    setSubmissions((cur) => ({ ...cur, [prediction.id]: option }))
    return result
  }

  return { active, upcoming, submissions, loading, error, submit, reload: load }
}
