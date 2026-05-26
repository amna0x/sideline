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
  const [typingUsers, setTypingUsers] = useState([])
  const [roles, setRoles] = useState({})
  const chatMessages = useStore((s) => s.squadChat)

  useEffect(() => {
    let cancelled = false
    getSocket().then((s) => {
      if (cancelled) return
      socketRef.current = s

      s.on('squad:state', (state) => {
        setSquad(state)
        setSquadMembers(state.members)
        setRoles(state.roles || {})
        useStore.getState().pushNotification({ type: 'squad', title: `JOINED ${state.name}`, message: `${state.memberCount} members`, icon: '👥', duration: 3000 })
      })

      s.on('squad:chat_history', (messages) => {
        useStore.getState().setSquadChat(messages)
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
        useStore.getState().appendSquadChat(msg)
        setTypingUsers((prev) => prev.filter((u) => u.userId !== msg.user_id))
      })

      s.on('squad:message_seen', ({ messageId, userId: seenBy, username }) => {
        useStore.getState().setSquadChat(useStore.getState().squadChat.map((m) => {
          if (m.id === messageId) {
            const seenList = m.seen_by || []
            if (seenList.find((s) => s.userId === seenBy)) return m
            return { ...m, seen_by: [...seenList, { userId: seenBy, username }] }
          }
          return m
        }))
      })

      s.on('squad:user_typing', ({ userId, username }) => {
        setTypingUsers((prev) => {
          const exists = prev.find((u) => u.userId === userId)
          if (exists) return prev
          return [...prev, { userId, username }]
        })
        // Auto-clear typing after 3s
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
        }, 3000)
      })

      s.on('squad:visibility_changed', ({ visibility }) => {
        useStore.setState((prev) => ({
          squad: prev.squad ? { ...prev.squad, visibility } : null
        }))
      })

      s.on('squad:roles_updated', ({ roles: newRoles }) => {
        setRoles(newRoles)
      })

      s.on('squad:kicked', ({ squadName }) => {
        setSquad(null)
        setSquadMembers([])
        useStore.getState().setSquadChat([])
        setRoles({})
        useStore.getState().showToast(`You were removed from ${squadName}`)
      })

      s.on('squad:admin_transferred', ({ newAdminId, newAdminName }) => {
        useStore.getState().showToast(`${newAdminName} is now the squad admin`)
      })

      s.on('squad:leave_info', (info) => {
        // Handled by the component via leaveInfo state
      })

      s.on('squad:invite_code', ({ code, squadName }) => {
        const url = `${window.location.origin}/squad?invite=${code}`
        if (navigator.share) {
          navigator.share({ title: `Join ${squadName} on Sideline`, text: `Use code: ${code}`, url }).catch(() => {})
        } else {
          navigator.clipboard.writeText(code).then(() => useStore.getState().showToast(`Invite code copied: ${code}`))
        }
      })

      s.on('squad:challenge_received', (challenge) => setActiveDuel({ ...challenge, role: 'opponent', status: 'pending' }))
      s.on('squad:challenge_sent', ({ duelId }) => useStore.setState((prev) => ({ activeDuel: prev.activeDuel ? { ...prev.activeDuel, duelId, status: 'waiting' } : null })))
      s.on('squad:duel_active', (duel) => setActiveDuel({ ...duel, status: 'active' }))
      s.on('squad:duel_update', (update) => updateDuel(update))
      s.on('squad:duel_result', (result) => setActiveDuel({ ...result, status: 'resolved' }))
      s.on('squad:error', ({ message }) => useStore.getState().showToast(message))
    })

    return () => {
      cancelled = true
      if (socketRef.current) {
        const events = ['squad:state', 'squad:member_joined', 'squad:member_left', 'squad:reaction_burst',
          'squad:chat_message', 'squad:user_typing', 'squad:visibility_changed', 'squad:roles_updated',
          'squad:kicked', 'squad:admin_transferred', 'squad:leave_info', 'squad:invite_code', 'squad:challenge_received', 'squad:challenge_sent',
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
    useStore.getState().setSquadChat([])
    setRoles({})
  }, [setSquad, setSquadMembers])

  const checkLeave = useCallback(() => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ type: 'member' })
      const handler = (info) => {
        socketRef.current.off('squad:leave_info', handler)
        resolve(info)
      }
      socketRef.current.on('squad:leave_info', handler)
      socketRef.current.emit('squad:check_leave')
      // Timeout fallback
      setTimeout(() => { socketRef.current?.off('squad:leave_info', handler); resolve({ type: 'member' }) }, 3000)
    })
  }, [])

  const sendReaction = useCallback((emoji) => {
    socketRef.current?.emit('squad:reaction', { emoji })
  }, [])

  const sendMessage = useCallback((text, opts = {}) => {
    socketRef.current?.emit('squad:message', {
      text,
      replyTo: opts.replyTo || null,
      msgType: opts.msgType || 'text',
      stickerId: opts.stickerId || null
    })
  }, [])

  const markSeen = useCallback((messageId) => {
    socketRef.current?.emit('squad:mark_seen', { messageId })
  }, [])

  const sendTyping = useCallback(() => {
    socketRef.current?.emit('squad:typing')
  }, [])

  const getInviteCode = useCallback(() => {
    socketRef.current?.emit('squad:get_invite')
  }, [])

  const setVisibility = useCallback((visibility) => {
    socketRef.current?.emit('squad:set_visibility', { visibility })
  }, [])

  const promote = useCallback((targetUserId) => {
    socketRef.current?.emit('squad:promote', { targetUserId })
  }, [])

  const demote = useCallback((targetUserId) => {
    socketRef.current?.emit('squad:demote', { targetUserId })
  }, [])

  const kick = useCallback((targetUserId) => {
    socketRef.current?.emit('squad:kick', { targetUserId })
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

  return {
    squad, roles, typingUsers, chatMessages,
    joinSquad, joinByInvite, leaveSquad, checkLeave,
    sendReaction, sendMessage, sendTyping, markSeen, getInviteCode,
    setVisibility, promote, demote, kick,
    sendChallenge, acceptChallenge, submitDuelPick
  }
}
