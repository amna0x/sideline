import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import ReactionBurst from '../components/ReactionBurst.jsx'
import DuelCard from '../components/DuelCard.jsx'
import Avatar from '../components/Avatar.jsx'
import { useSquad } from '../hooks/useSquad.js'
import { useMatch } from '../hooks/useMatch.js'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'

const REACTIONS = ['⚽', '🔥', '😱', '👏', '💀']

export default function Squad() {
  const { match } = useMatch()
  const {
    squad, roles, typingUsers, chatMessages,
    joinSquad, joinByInvite, leaveSquad, checkLeave, sendReaction, sendMessage, sendTyping,
    getInviteCode, setVisibility, promote, demote, kick,
    sendChallenge, acceptChallenge
  } = useSquad()
  const squadMembers = useStore((s) => s.squadMembers)
  const activeDuel = useStore((s) => s.activeDuel)
  const userId = useStore((s) => s.user?.id)
  const showToast = useStore((s) => s.showToast)
  const [rooms, setRooms] = useState([])
  const [joinName, setJoinName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaveInfo, setLeaveInfo] = useState(null) // { type: 'member' | 'transfer' | 'disband', nextAdminName? }
  const [confirmCreate, setConfirmCreate] = useState(null)
  const [searchDropdown, setSearchDropdown] = useState([])
  const [showManage, setShowManage] = useState(false)
  const [existingSquad, setExistingSquad] = useState(undefined) // undefined = loading, null = none, object = has squad

  const myRole = roles[userId] || 'member'
  const isAdmin = myRole === 'admin'
  const isMod = myRole === 'moderator'

  // Check if user already has a squad (persisted)
  useEffect(() => {
    if (!userId) return
    api.get(`/api/squad/user/${userId}`).then((data) => {
      setExistingSquad(data || null)
      // Auto-rejoin if they have a squad and socket isn't connected to it yet
      if (data?.id && !squad) {
        const parts = data.id.split('::')
        const matchId = parts[0] || 'lobby'
        const name = data.name || parts.slice(1).join('::')
        if (name) joinSquad(name, matchId)
      }
    }).catch(() => setExistingSquad(null))
  }, [userId])

  useEffect(() => {
    const matchId = match?.id || 'lobby'
    setLoadingRooms(true)
    api.get(`/api/squad/rooms?match_id=${matchId}`)
      .then(setRooms).catch(() => {})
      .finally(() => setLoadingRooms(false))
  }, [match?.id, squad])

  function handleJoinAttempt(name) {
    if (!name?.trim()) return
    const trimmed = name.trim()
    const matchId = match?.id || 'lobby'
    const existing = rooms.find((r) => r.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      joinSquad(trimmed, matchId)
      setJoinName('')
      setSearchDropdown([])
    } else {
      setConfirmCreate(trimmed)
    }
  }

  function handleConfirmCreate() {
    if (!confirmCreate) return
    joinSquad(confirmCreate, match?.id || 'lobby')
    setJoinName('')
    setConfirmCreate(null)
    setSearchDropdown([])
  }

  function handleSearchInput(val) {
    setJoinName(val)
    if (val.trim().length >= 1) {
      setSearchDropdown(rooms.filter((r) => r.name.toLowerCase().includes(val.toLowerCase())))
    } else {
      setSearchDropdown([])
    }
  }

  function handleJoinInvite() {
    if (!inviteInput.trim()) return
    joinByInvite(inviteInput.trim().toUpperCase())
    setInviteInput('')
  }

  // LOBBY VIEW
  if (!squad) {
    // Still loading or auto-rejoining existing squad
    if (existingSquad === undefined || (existingSquad && existingSquad.name)) {
      return (
        <Layout title="SQUAD">
          <div className="flex items-center justify-center py-20">
            <span className="text-sm text-[#999]">Connecting to your squad…</span>
          </div>
        </Layout>
      )
    }

    return (
      <Layout title="SQUAD">
        <section className="px-4 pt-6 relative overflow-hidden">
          <ReactionBurst />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
            <span className="text-5xl mb-3 block">🎯</span>
            <h1 className="font-comic text-3xl text-[var(--sv-accent)] mb-2">SQUAD UP</h1>
            <p className="text-[#999] text-sm">Join a room, react together, chat with friends</p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white border border-[#e0e0e0] rounded-2xl p-4 mb-3">
            <label className="font-comic text-xs text-[var(--sv-accent)] mb-2 block">CREATE OR JOIN</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type="text" value={joinName} onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinAttempt(joinName)}
                  placeholder="Squad name…" maxLength={24}
                  className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[var(--sv-accent)] focus:outline-none" />
                {searchDropdown.length > 0 && joinName.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e0e0] rounded-xl shadow-lg z-20 overflow-hidden">
                    {searchDropdown.map((r) => (
                      <button key={r.id} onClick={() => { joinSquad(r.name, match?.id || 'lobby'); setJoinName(''); setSearchDropdown([]) }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#f5f5f5] border-b border-[#f0f0f0] last:border-b-0">
                        <div>
                          <span className="text-sm text-[#1a1a1a] font-medium">{r.name}</span>
                          <span className="block text-[10px] text-[#999]">{r.memberCount} member{r.memberCount !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-xs text-[var(--sv-accent)] font-comic">JOIN</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleJoinAttempt(joinName)} disabled={!joinName.trim()}
                className="px-5 py-3 rounded-xl font-comic text-sm bg-[var(--sv-accent)] text-white disabled:opacity-40">GO</motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="bg-white border border-[#e0e0e0] rounded-2xl p-4 mb-4">
            <label className="font-comic text-xs text-[var(--sv-accent)] mb-2 block">JOIN VIA INVITE</label>
            <div className="flex gap-2">
              <input type="text" value={inviteInput} onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinInvite()}
                placeholder="Paste invite code…" maxLength={8}
                className="flex-1 bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] font-comic tracking-widest uppercase placeholder:text-[#bbb] placeholder:tracking-normal placeholder:normal-case focus:border-[var(--sv-accent)] focus:outline-none" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleJoinInvite} disabled={!inviteInput.trim()}
                className="px-5 py-3 rounded-xl font-comic text-sm bg-[var(--sv-accent)] text-white disabled:opacity-40">JOIN</motion.button>
            </div>
          </motion.div>

          {rooms.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="font-comic text-xs text-[var(--sv-accent)] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">groups</span> ACTIVE SQUADS
              </h2>
              <div className="space-y-2">
                {rooms.sort((a, b) => b.memberCount - a.memberCount).map((r) => (
                  <motion.button key={r.id} whileTap={{ scale: 0.98 }} onClick={() => joinSquad(r.name, match?.id || 'lobby')}
                    className="w-full bg-white border border-[#e0e0e0] rounded-xl p-3 flex items-center justify-between text-left">
                    <div>
                      <span className="font-comic text-sm text-[#1a1a1a]">{r.name}</span>
                      <span className="block text-[10px] text-[#999]">{r.memberCount} member{r.memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="material-symbols-outlined text-[var(--sv-accent)] text-[20px]">arrow_forward</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {loadingRooms && <div className="text-center py-8"><span className="text-sm text-[#999]">Loading rooms…</span></div>}
          {!loadingRooms && rooms.length === 0 && (
            <div className="text-center py-8"><span className="text-sm text-[#999]">No active rooms — be the first!</span></div>
          )}
        </section>

        {confirmCreate && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl border border-[#e0e0e0] p-5 max-w-xs w-full shadow-lg">
              <h3 className="font-comic text-lg text-[#1a1a1a] mb-2">Create Squad?</h3>
              <p className="text-sm text-[#666] mb-4">No squad named "<strong>{confirmCreate}</strong>" exists yet. Create it?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmCreate(null)} className="flex-1 py-2.5 border border-[#e0e0e0] rounded-xl font-comic text-sm text-[#666]">CANCEL</button>
                <button onClick={handleConfirmCreate} className="flex-1 py-2.5 bg-[var(--sv-accent)] text-white rounded-xl font-comic text-sm">CREATE</button>
              </div>
            </motion.div>
          </div>
        )}
      </Layout>
    )
  }

  // ROOM VIEW
  return (
    <Layout title={squad.name?.toUpperCase()}>
      <section className="px-4 pt-4 relative overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 56px - 80px)' }}>
        <ReactionBurst />

        {/* Room header */}
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-comic text-lg text-[var(--sv-accent)]">{squad.name}</h2>
              <span className="text-xs text-[#999]">{squadMembers.length} watching · {squad.visibility === 'private' ? '🔒 Private' : '🌐 Public'}</span>
            </div>
            <div className="flex gap-1.5">
              {(isAdmin || isMod) && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowManage(true)}
                  className="px-2 py-1 rounded-lg font-comic text-xs border border-[#e0e0e0] text-[#666]">
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => getInviteCode()}
                className="px-2 py-1 rounded-lg font-comic text-xs border border-[var(--sv-accent)] text-[var(--sv-accent)]">
                <span className="material-symbols-outlined text-[14px]">link</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={async () => {
                const info = await checkLeave()
                setLeaveInfo(info)
                setConfirmLeave(true)
              }}
                className="px-2 py-1 rounded-lg font-comic text-xs border border-red-300 text-red-500">
                <span className="material-symbols-outlined text-[14px]">logout</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Members row */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 shrink-0">
          {squadMembers.map((m) => (
            <div key={m.userId} className="flex flex-col items-center min-w-[48px]">
              <div className={`rounded-full border-2 ${m.userId === userId ? 'border-[var(--sv-accent)]' : roles[m.userId] === 'admin' ? 'border-yellow-400' : roles[m.userId] === 'moderator' ? 'border-blue-400' : 'border-[#e0e0e0]'} p-0.5`}>
                <Avatar url={m.avatar_url} name={m.username} size={36} />
              </div>
              <span className="text-[9px] text-[#999] mt-0.5 truncate w-12 text-center">
                {m.userId === userId ? 'YOU' : m.username}
              </span>
              {roles[m.userId] === 'admin' && <span className="text-[8px] text-yellow-600">👑</span>}
              {roles[m.userId] === 'moderator' && <span className="text-[8px] text-blue-500">⭐</span>}
            </div>
          ))}
        </div>

        {/* Reactions bar */}
        <div className="flex justify-center gap-2 py-2 shrink-0">
          {REACTIONS.map((emoji) => (
            <motion.button key={emoji} whileTap={{ scale: 0.8 }} onClick={() => sendReaction(emoji)}
              className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center text-xl hover:border-[var(--sv-accent)] transition-colors">{emoji}</motion.button>
          ))}
        </div>

        {/* Chat area */}
        <ChatArea messages={chatMessages} userId={userId} onSend={sendMessage} onTyping={sendTyping} typingUsers={typingUsers} />

        <AnimatePresence>
          {activeDuel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
              <DuelCard duel={activeDuel} onAccept={acceptChallenge} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Leave confirmation */}
      {confirmLeave && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl border border-[#e0e0e0] p-5 max-w-xs w-full shadow-lg">
            <h3 className="font-comic text-lg text-[#1a1a1a] mb-2">Leave Squad?</h3>
            <p className="text-sm text-[#666] mb-4">
              {leaveInfo?.type === 'disband'
                ? 'You are the only member. Leaving will permanently disband this squad.'
                : leaveInfo?.type === 'transfer'
                ? `Admin will be transferred to ${leaveInfo.nextAdminName}. You can rejoin later as a regular member.`
                : 'You will lose access to the chat and reactions.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmLeave(false); setLeaveInfo(null) }} className="flex-1 py-2.5 border border-[#e0e0e0] rounded-xl font-comic text-sm text-[#666]">STAY</button>
              <button onClick={() => { leaveSquad(); setConfirmLeave(false); setLeaveInfo(null); setExistingSquad(null) }}
                className={`flex-1 py-2.5 rounded-xl font-comic text-sm text-white ${leaveInfo?.type === 'disband' ? 'bg-red-600' : 'bg-red-500'}`}>
                {leaveInfo?.type === 'disband' ? 'DISBAND' : 'LEAVE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Management panel */}
      <AnimatePresence>
        {showManage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center" onClick={() => setShowManage(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[390px] bg-white rounded-t-2xl border-t border-[#e0e0e0] max-h-[75vh] overflow-y-auto pb-20">
              <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between">
                <h3 className="font-comic text-base text-[#1a1a1a]">Squad Management</h3>
                <button onClick={() => setShowManage(false)} className="text-[#999]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Visibility toggle (admin only) */}
              {isAdmin && (
                <div className="p-4 border-b border-[#f0f0f0]">
                  <label className="font-comic text-xs text-[#999] mb-2 block">VISIBILITY</label>
                  <div className="flex gap-2">
                    <button onClick={() => setVisibility('public')}
                      className={`flex-1 py-2.5 rounded-xl font-comic text-sm ${squad.visibility === 'public' ? 'bg-[var(--sv-accent)] text-white' : 'border border-[#e0e0e0] text-[#666]'}`}>
                      🌐 Public
                    </button>
                    <button onClick={() => setVisibility('private')}
                      className={`flex-1 py-2.5 rounded-xl font-comic text-sm ${squad.visibility === 'private' ? 'bg-[var(--sv-accent)] text-white' : 'border border-[#e0e0e0] text-[#666]'}`}>
                      🔒 Private
                    </button>
                  </div>
                  <p className="text-[10px] text-[#999] mt-1">{squad.visibility === 'private' ? 'Only invite link can join' : 'Visible to everyone'}</p>
                </div>
              )}

              {/* Invite code */}
              <div className="p-4 border-b border-[#f0f0f0]">
                <label className="font-comic text-xs text-[#999] mb-2 block">INVITE CODE</label>
                <div className="flex items-center gap-2">
                  <span className="font-comic text-lg tracking-widest text-[#1a1a1a] bg-[#f8f8f8] px-4 py-2 rounded-xl flex-1 text-center">{squad.inviteCode}</span>
                  <button onClick={() => getInviteCode()} className="px-3 py-2 rounded-xl bg-[var(--sv-accent)] text-white font-comic text-xs">COPY</button>
                </div>
              </div>

              {/* Members list with actions */}
              <div className="p-4">
                <label className="font-comic text-xs text-[#999] mb-2 block">MEMBERS ({squadMembers.length})</label>
                <div className="space-y-2">
                  {squadMembers.map((m) => {
                    const memberRole = roles[m.userId] || 'member'
                    const canKick = (isAdmin || isMod) && m.userId !== userId && memberRole !== 'admin'
                    const canPromote = isAdmin && m.userId !== userId && memberRole === 'member'
                    const canDemote = isAdmin && memberRole === 'moderator'
                    return (
                      <div key={m.userId} className="flex items-center gap-2 bg-[#f8f8f8] rounded-xl px-3 py-2">
                        <Avatar url={m.avatar_url} name={m.username} size={32} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[#1a1a1a] truncate block">{m.username}{m.userId === userId ? ' (you)' : ''}</span>
                          <span className="text-[10px] text-[#999]">
                            {memberRole === 'admin' ? '👑 Admin' : memberRole === 'moderator' ? '⭐ Moderator' : 'Member'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {canPromote && (
                            <button onClick={() => promote(m.userId)} className="px-2 py-1 rounded-lg text-[9px] font-comic bg-blue-50 text-blue-600 border border-blue-200">MOD</button>
                          )}
                          {canDemote && (
                            <button onClick={() => demote(m.userId)} className="px-2 py-1 rounded-lg text-[9px] font-comic bg-gray-50 text-[#666] border border-[#e0e0e0]">DEMOTE</button>
                          )}
                          {canKick && (
                            <button onClick={() => kick(m.userId)} className="px-2 py-1 rounded-lg text-[9px] font-comic bg-red-50 text-red-500 border border-red-200">KICK</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

// iOS-style chat with animations and sound effects
function ChatArea({ messages, userId, onSend, onTyping, typingUsers }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Play send sound
  function playSendSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.12)
    } catch {}
  }

  // Play receive sound
  function playReceiveSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.06)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } catch {}
  }

  // Play sound on new messages from others
  const prevCount = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevCount.current) {
      const last = messages[messages.length - 1]
      if (last?.user_id !== userId) playReceiveSound()
    }
    prevCount.current = messages.length
  }, [messages.length, userId])

  function handleInput(val) {
    setText(val)
    // Emit typing indicator (throttled)
    if (!typingTimeout.current) {
      onTyping()
      typingTimeout.current = setTimeout(() => { typingTimeout.current = null }, 2000)
    }
  }

  function handleSend() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    playSendSound()
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 mt-2">
      <div className="flex-1 overflow-y-auto space-y-1 px-1 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-6 text-[#bbb] text-sm">No messages yet — say something!</div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.user_id === userId
            const showName = !isMe && (i === 0 || messages[i - 1]?.user_id !== msg.user_id)
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] px-3.5 py-2 ${isMe
                  ? 'bg-[var(--sv-accent)] text-white rounded-[18px] rounded-br-[4px]'
                  : 'bg-[#f0f0f0] text-[#1a1a1a] rounded-[18px] rounded-bl-[4px]'}`}>
                  {showName && <div className="text-[10px] font-comic opacity-70 mb-0.5">{msg.username}</div>}
                  <div className="text-[14px] leading-snug">{msg.message}</div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-2 pb-1">
            <div className="flex items-center gap-1.5 text-[11px] text-[#999]">
              <span className="flex gap-0.5">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#999] rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#999] rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#999] rounded-full" />
              </span>
              <span>{typingUsers.map((u) => u.username).join(', ')} typing</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex gap-2 pt-2 shrink-0">
        <input type="text" value={text} onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message…" maxLength={500}
          className="flex-1 bg-[#f8f8f8] border border-[#e0e0e0] rounded-full px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[var(--sv-accent)] focus:outline-none" />
        <motion.button
          whileTap={{ scale: 0.85 }}
          animate={text.trim() ? { scale: [1, 1.1, 1] } : {}}
          onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-[var(--sv-accent)] text-white flex items-center justify-center disabled:opacity-40 transition-opacity">
          <motion.span
            className="material-symbols-outlined text-[18px]"
            animate={text.trim() ? { rotate: [0, -20, 0] } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
          >send</motion.span>
        </motion.button>
      </div>
    </div>
  )
}
