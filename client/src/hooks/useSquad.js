import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '../store/index.js'
import { getSocket } from '../lib/socket.js'

export function useSquad() {
  const squad = useStore((s) => s.squad)
  const setSquad = useStore((s) => s.setSquad)
  const setSquadMembers = useStore((s) => s.setSquadMembers)
  const addReaction = useStore((s) => s.addReaction)
  const setActiveDuel = useStore((s) => s.setActiveDuel)
  const updateDuel = useStore((s) => s.updateDuel)
  const socketRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getSocket().then((s) => {
      if (cancelled) return
      socketRef.current = s

      s.on('squad:state', (state) => {
        setSquad(state)
        setSquadMembers(state.members)
        useStore.getState().pushNotification({ type: 'squad', title: `JOINED ${state.name}`, message: `${state.memberCount} members`, icon: '👥', duration: 3000 })
      })

      s.on('squad:member_joined', (member) => {
        useStore.setState((prev) => ({
          squadMembers: [...prev.squadMembers.filter((m) => m.userId !== member.userId), member]
        }))
        useStore.getState().pushNotification({ type: 'squad', title: `${member.username} JOINED`, message: 'New squadmate!', icon: '👋', duration: 2500 })
      })

      s.on('squad:member_left', ({ userId, memberCount }) => {
        useStore.setState((prev) => ({
          squadMembers: prev.squadMembers.filter((m) => m.userId !== userId)
        }))
      })

      s.on('squad:reaction_burst', (reaction) => {
        addReaction(reaction)
      })

      s.on('squad:challenge_received', (challenge) => {
        setActiveDuel({ ...challenge, role: 'opponent', status: 'pending' })
        useStore.getState().pushNotification({ type: 'duel', title: 'DUEL CHALLENGE', message: `${challenge.challengerName} wants to battle!`, icon: '⚔️', duration: 6000 })
      })

      s.on('squad:challenge_sent', ({ duelId }) => {
        useStore.setState((prev) => ({
          activeDuel: prev.activeDuel ? { ...prev.activeDuel, duelId, status: 'waiting' } : null
        }))
      })

      s.on('squad:duel_active', (duel) => {
        setActiveDuel({ ...duel, status: 'active' })
      })

      s.on('squad:duel_update', (update) => {
        updateDuel(update)
      })

      s.on('squad:duel_result', (result) => {
        setActiveDuel({ ...result, status: 'resolved' })
        const won = result.result === 'opponent_wins' || result.result === 'challenger_wins'
        useStore.getState().pushNotification({
          type: 'duel',
          title: result.result === 'draw' ? 'DUEL DRAW' : won ? 'DUEL RESULT' : 'DUEL OVER',
          message: `Correct: ${result.correctAnswer}`,
          icon: result.result === 'draw' ? '🤝' : '⚔️',
          duration: 5000
        })
      })

      s.on('squad:error', ({ message }) => {
        useStore.getState().showToast(message)
      })
    })

    return () => {
      cancelled = true
      if (socketRef.current) {
        socketRef.current.off('squad:state')
        socketRef.current.off('squad:member_joined')
        socketRef.current.off('squad:member_left')
        socketRef.current.off('squad:reaction_burst')
        socketRef.current.off('squad:challenge_received')
        socketRef.current.off('squad:challenge_sent')
        socketRef.current.off('squad:duel_active')
        socketRef.current.off('squad:duel_update')
        socketRef.current.off('squad:duel_result')
        socketRef.current.off('squad:error')
      }
    }
  }, [])

  const joinSquad = useCallback((squadName, matchId) => {
    socketRef.current?.emit('squad:join', { squadName, matchId })
  }, [])

  const leaveSquad = useCallback(() => {
    socketRef.current?.emit('squad:leave')
    setSquad(null)
    setSquadMembers([])
  }, [setSquad, setSquadMembers])

  const sendReaction = useCallback((emoji) => {
    socketRef.current?.emit('squad:reaction', { emoji })
  }, [])

  const sendChallenge = useCallback((opponentId, predictionId) => {
    setActiveDuel({ opponentId, predictionId, role: 'challenger', status: 'sending' })
    socketRef.current?.emit('squad:challenge', { opponentId, predictionId })
  }, [setActiveDuel])

  const acceptChallenge = useCallback((duelId) => {
    socketRef.current?.emit('squad:challenge_accept', { duelId })
  }, [])

  const submitDuelPick = useCallback((duelId, pick) => {
    socketRef.current?.emit('squad:duel_pick', { duelId, pick })
  }, [])

  return { squad, joinSquad, leaveSquad, sendReaction, sendChallenge, acceptChallenge, submitDuelPick }
}
