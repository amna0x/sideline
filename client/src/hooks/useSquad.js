import { useEffect, useCallback, useRef, useState } from 'react'
import { useStore } from '../store/index.js'
import { getSocket } from '../lib/socket.js'
import { requireSignedIn } from '../lib/guestGuard.js'

function normalizeSeenBy(seenBy) {
  if (!Array.isArray(seenBy)) return []
  return seenBy
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      userId: String(entry.userId || ''),
      username: String(entry.username || 'Member')
    }))
    .filter((entry) => entry.userId)
}

function normalizeChatMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    return {
      id: `fallback-${Date.now()}-${Math.random()}`,
      squad_id: '',
      user_id: '',
      username: 'Member',
      avatar_url: null,
      message: '',
      msg_type: 'text',
      sticker_id: null,
      reply_to_id: null,
      reply_to_text: null,
      reply_to_username: null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      seen_by: []
    }
  }

  return {
    ...msg,
    id: String(msg.id || `fallback-${Date.now()}-${Math.random()}`),
    squad_id: msg.squad_id ? String(msg.squad_id) : '',
    user_id: msg.user_id ? String(msg.user_id) : '',
    username: String(msg.username || 'Member'),
    avatar_url: msg.avatar_url || null,
    message: typeof msg.message === 'string' ? msg.message : (msg.message == null ? '' : String(msg.message)),
    msg_type: typeof msg.msg_type === 'string' ? msg.msg_type : 'text',
    sticker_id: msg.sticker_id || null,
    reply_to_id: msg.reply_to_id || null,
    reply_to_text: typeof msg.reply_to_text === 'string' ? msg.reply_to_text : null,
    reply_to_username: typeof msg.reply_to_username === 'string' ? msg.reply_to_username : null,
    created_at: msg.created_at || new Date().toISOString(),
    edited_at: msg.edited_at || null,
    deleted_at: msg.deleted_at || null,
    seen_by: normalizeSeenBy(msg.seen_by)
  }
}

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
        // Don't show notification on re-mount, only on fresh join
        if (!useStore.getState().squad) {
          useStore.getState().pushNotification({ type: 'squad', title: `JOINED ${state.name}`, message: `${state.memberCount} members`, icon: '👥', duration: 3000 })
        }
      })

      s.on('squad:chat_history', (messages) => {
        const safeMessages = Array.isArray(messages) ? messages.map(normalizeChatMessage) : []
        useStore.getState().setSquadChat(safeMessages)
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
        useStore.getState().appendSquadChat(normalizeChatMessage(msg))
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

      s.on('squad:message_updated', ({ messageId, message, edited_at }) => {
        useStore.getState().updateSquadChatMsg(messageId, { message, edited_at })
      })

      s.on('squad:message_deleted', ({ messageId, deleted_at }) => {
        useStore.getState().updateSquadChatMsg(messageId, {
          message: '',
          msg_type: 'deleted',
          deleted_at
        })
      })

      s.on('squad:chat_cleared', () => {
        useStore.getState().setSquadChat([])
        useStore.getState().showToast('Chat cleared')
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

      s.on('squad:visibility_changed', ({ visibility, inviteEnabled }) => {
        const { user, squad: currentSquad } = useStore.getState()
        const currentRoles = currentSquad?.roles || {}
        const isAdmin = currentRoles[user?.id] === 'admin' || currentSquad?.createdBy === user?.id
        useStore.setState((prev) => ({
          squad: prev.squad ? {
            ...prev.squad,
            visibility,
            ...(inviteEnabled !== undefined ? { inviteEnabled } : {}),
            ...(visibility === 'private' && !isAdmin && !inviteEnabled ? { inviteCode: '' } : {})
          } : null
        }))
      })

      s.on('squad:invite_visibility_changed', ({ inviteEnabled, inviteCode }) => {
        const { user, squad: currentSquad } = useStore.getState()
        const currentRoles = currentSquad?.roles || {}
        const isAdmin = currentRoles[user?.id] === 'admin' || currentSquad?.createdBy === user?.id
        useStore.setState((prev) => ({
          squad: prev.squad ? {
            ...prev.squad,
            inviteEnabled,
            ...(inviteCode !== undefined ? { inviteCode } : {}),
            ...(!inviteEnabled && prev.squad.visibility === 'private' && !isAdmin ? { inviteCode: '' } : {})
          } : null
        }))
      })

      s.on('squad:rooms_changed', () => {
        useStore.getState().bumpSquadRoomsVersion()
      })

      s.on('squad:roles_updated', ({ roles: newRoles }) => {
        setRoles(newRoles)
        useStore.setState((prev) => ({
          squad: prev.squad ? { ...prev.squad, roles: newRoles } : null
        }))
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
        useStore.setState((prev) => ({
          squad: prev.squad ? { ...prev.squad, inviteCode: code } : null
        }))
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

      // Re-join squad on reconnect (handles tab switch / sleep / network drop)
      s.on('connect', () => {
        const currentSquad = useStore.getState().squad
        if (currentSquad?.name && currentSquad?.matchId) {
          s.emit('squad:join', { squadName: currentSquad.name, matchId: currentSquad.matchId })
        }
      })
    })

    return () => {
      cancelled = true
      if (socketRef.current) {
        const events = ['squad:state', 'squad:member_joined', 'squad:member_left', 'squad:reaction_burst',
          'squad:chat_message', 'squad:user_typing', 'squad:visibility_changed', 'squad:invite_visibility_changed', 'squad:rooms_changed', 'squad:roles_updated',
          'squad:kicked', 'squad:admin_transferred', 'squad:leave_info', 'squad:invite_code', 'squad:message_updated', 'squad:message_deleted', 'squad:chat_cleared', 'squad:challenge_received', 'squad:challenge_sent',
          'squad:duel_active', 'squad:duel_update', 'squad:duel_result', 'squad:error', 'connect']
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

  const editMessage = useCallback((messageId, text) => {
    socketRef.current?.emit('squad:message_edit', { messageId, text })
  }, [])

  const deleteMessage = useCallback((messageId) => {
    socketRef.current?.emit('squad:message_delete', { messageId })
  }, [])

  const clearChat = useCallback(() => {
    socketRef.current?.emit('squad:clear_chat')
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

  const setInviteEnabled = useCallback((enabled) => {
    socketRef.current?.emit('squad:set_invite_enabled', { enabled })
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
    setVisibility, setInviteEnabled, promote, demote, kick,
    sendChallenge, acceptChallenge, submitDuelPick,
    editMessage, deleteMessage, clearChat
  }
}
