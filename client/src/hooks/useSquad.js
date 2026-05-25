import { useEffect, useCallback, useRef, useState } from 'react'
import { useStore } from '../store/index.js'
import { getSocket } from '../lib/socket.js'
import { requireSignedIn } from '../lib/guestGuard.js'

export function useSquad() {
  const squad = useStore((s) => s.squad)
  const setSquad = useStore((s) => s.setSquad)
  const setSquadMembers = useStore((s) => s.setSquadMembers)
  const addReaction = useStore((s) => s.addReaction)
  const setActiveDuel = useStore((s) => s.setActiveDuel)
  const updateDuel = useStore((s) => s.updateDuel)
  const showToast = useStore((s) => s.showToast)
  const socketRef = useRef(null)
  const [chatMessages, setChatMessages] = useState([])

  useEffect(() => {
    let cancelled = false
    getSocket().then((s) => {
      if (cancelled) return
      socketRef.current = s

      s.on('squad:state', (state) => {
        setSquad(state)
        setSquadMembers(state.members)
        setChatMessages([])
        useStore.getState().pushNotification({ type: 'squad', title: `JOINED ${state.name}`, message: `${state.memberCount} members`, icon: '👥', duration: 3000 })
      })

      s.on('squad:member_joined', (member) => {
        useStore.setState((prev) => ({
          squadMembers: [...prev.squadMembers.filter((m) => m.userId !== member.userId), member]
        }))
      })

      s.on('squad:member_left', ({ userId, memberCount }) => {
        useStore.setState((prev) => ({
          squadMembers: prev.squadMembers.filter((m) => m.userId !== userId)
        }))
      })

      s.on('squad:reaction_burst', (reaction) => addReaction(reaction))

      s.on('squad:chat_message', (msg) => {
        setChatMessages((prev) => [...prev.slice(-99), msg])
      })

      s.on('squad:invite_code', ({ code, squadName }) => {
        const url = `${window.location.origin}/squad?invite=${code}`
        if (navigator.share) {
          navigator.share({ title: `Join ${squadName} on Sideline`, text: `Use code: ${code}`, url }).catch(() => {})
        } else {
          navigator.clipboard.writeText(code).then(() => useStore.getState().showToast(`Invite code copied: ${code}`))
        }
      })

      s.on('squad:challenge_received', (challenge) => {
        setActiveDuel({ ...challenge, role: 'opponent', status: 'pending' })
      })

      s.on('squad:challenge_sent', ({ duelId }) => {
        useStore.setState((prev) => ({
          activeDuel: prev.activeDuel ? { ...prev.activeDuel, duelId, status: 'waiting' } : null
        }))
      })

      s.on('squad:duel_active', (duel) => setActiveDuel({ ...duel, status: 'active' }))
      s.on('squad:duel_update', (update) => updateDuel(update))
      s.on('squad:duel_result', (result) => setActiveDuel({ ...result, status: 'resolved' }))
      s.on('squad:error', ({ message }) => useStore.getState().showToast(message))
    })

    return () => {
      cancelled = true
      if (socketRef.current) {
        const events = ['squad:state', 'squad:member_joined', 'squad:member_left', 'squad:reaction_burst',
          'squad:chat_message', 'squad:invite_code', 'squad:challenge_received', 'squad:challenge_sent',
          'squad:duel_active', 'squad:duel_update', 'squad:duel_result', 'squad:error']
        events.forEach((e) => socketRef.current.off(e))
      }
    }
  }, [])

  const joinSquad = useCallback((squadName, matchId) => {
    if (!requireSignedIn('squads')) return
    socketRef.current?.emit('squad:join', { squadName, matchId })
  }, [])

  const joinByInvite = useCallback((code) => {
    if (!requireSignedIn('squads')) return
    socketRef.current?.emit('squad:join_invite', { code })
  }, [])

  const leaveSquad = useCallback(() => {
    socketRef.current?.emit('squad:leave')
    setSquad(null)
    setSquadMembers([])
    setChatMessages([])
  }, [setSquad, setSquadMembers])

  const sendReaction = useCallback((emoji) => {
    socketRef.current?.emit('squad:reaction', { emoji })
  }, [])

  const sendMessage = useCallback((text) => {
    socketRef.current?.emit('squad:message', { text })
  }, [])

  const getInviteCode = useCallback(() => {
    socketRef.current?.emit('squad:get_invite')
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

  return { squad, joinSquad, joinByInvite, leaveSquad, sendReaction, sendMessage, getInviteCode, sendChallenge, acceptChallenge, submitDuelPick, chatMessages }
}
