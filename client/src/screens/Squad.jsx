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
  const { squad, joinSquad, joinByInvite, leaveSquad, sendReaction, sendMessage, getInviteCode, sendChallenge, acceptChallenge, chatMessages } = useSquad()
  const squadMembers = useStore((s) => s.squadMembers)
  const activeDuel = useStore((s) => s.activeDuel)
  const userId = useStore((s) => s.user?.id)
  const showToast = useStore((s) => s.showToast)
  const [rooms, setRooms] = useState([])
  const [joinName, setJoinName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(false)

  useEffect(() => {
    if (!match?.id) return
    setLoadingRooms(true)
    api.get(`/api/squad/rooms?match_id=${match.id}`)
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoadingRooms(false))
  }, [match?.id, squad])

  function handleJoin(name) {
    if (!name?.trim() || !match?.id) return
    joinSquad(name.trim(), match.id)
    setJoinName('')
  }

  function handleJoinInvite() {
    if (!inviteInput.trim()) return
    joinByInvite(inviteInput.trim().toUpperCase())
    setInviteInput('')
  }

  function handleCopyInvite() {
    getInviteCode()
    // The invite code will come back via socket event — handled in useSquad
  }

  if (!squad) {
    return (
      <Layout title="SQUAD">
        <section className="px-4 pt-6 relative overflow-hidden">
          <ReactionBurst />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
            <span className="text-5xl mb-3 block">🎯</span>
            <h1 className="font-comic text-3xl text-[var(--sv-accent)] mb-2">SQUAD UP</h1>
            <p className="text-on-surface-variant text-sm">Join a room, react together, chat with friends</p>
          </motion.div>

          {/* Create or join */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="comic-panel p-4 mb-4">
            <label className="font-comic text-sm text-[var(--sv-accent)] mb-2 block">CREATE OR JOIN</label>
            <div className="flex gap-2">
              <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin(joinName)}
                placeholder="Squad name…" maxLength={24}
                className="flex-1 bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl px-4 py-3 text-[#1a1a1a] font-body placeholder:text-[#bbb] focus:border-[var(--sv-accent)] focus:outline-none transition-colors" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleJoin(joinName)} disabled={!joinName.trim()}
                className="px-5 py-3 rounded-xl font-comic text-base bg-[var(--sv-accent)] text-white shadow-comic-sm disabled:opacity-40">GO</motion.button>
            </div>
          </motion.div>

          {/* Join via invite code */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="comic-panel p-4 mb-4">
            <label className="font-comic text-sm text-[var(--sv-accent)] mb-2 block">JOIN VIA INVITE</label>
            <div className="flex gap-2">
              <input type="text" value={inviteInput} onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinInvite()}
                placeholder="Paste invite code…" maxLength={8}
                className="flex-1 bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl px-4 py-3 text-[#1a1a1a] font-comic tracking-widest uppercase placeholder:text-[#bbb] placeholder:tracking-normal placeholder:normal-case focus:border-[var(--sv-accent)] focus:outline-none" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleJoinInvite} disabled={!inviteInput.trim()}
                className="px-5 py-3 rounded-xl font-comic text-base bg-[var(--sv-accent)] text-white shadow-comic-sm disabled:opacity-40">JOIN</motion.button>
            </div>
          </motion.div>

          {/* Active rooms */}
          {rooms.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="font-comic text-sm text-[var(--sv-accent)] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">groups</span> ACTIVE ROOMS
              </h2>
              <div className="space-y-2">
                {rooms.map((r) => (
                  <motion.button key={r.id} whileTap={{ scale: 0.98 }} onClick={() => handleJoin(r.name)}
                    className="w-full comic-panel p-3 flex items-center justify-between text-left">
                    <div>
                      <span className="font-comic text-base text-on-surface">{r.name}</span>
                      <span className="block text-xs text-outline">{r.memberCount} member{r.memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="material-symbols-outlined text-[var(--sv-accent)]">arrow_forward</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {loadingRooms && <div className="text-center py-8"><span className="font-comic text-outline">Loading rooms…</span></div>}
          {!loadingRooms && rooms.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center py-8">
              <span className="font-comic text-outline text-sm">No active rooms — be the first!</span>
            </motion.div>
          )}
        </section>
      </Layout>
    )
  }

  // In a squad room
  return (
    <Layout title={squad.name?.toUpperCase()}>
      <section className="px-4 pt-4 relative overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 56px - 80px)' }}>
        <ReactionBurst />

        {/* Room header */}
        <div className="comic-panel p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-comic text-lg text-[var(--sv-accent)]">{squad.name}</h2>
              <span className="text-xs text-on-surface-variant">{squadMembers.length} watching</span>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleCopyInvite}
                className="px-2 py-1 rounded-lg font-comic text-xs border border-[var(--sv-accent)] text-[var(--sv-accent)]">
                <span className="material-symbols-outlined text-[14px] mr-1">link</span>INVITE
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={leaveSquad}
                className="px-2 py-1 rounded-lg font-comic text-xs border border-error/40 text-error">LEAVE</motion.button>
            </div>
          </div>
        </div>

        {/* Members row */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 shrink-0">
          {squadMembers.map((m) => (
            <div key={m.userId} className="flex flex-col items-center min-w-[48px]">
              <div className={`rounded-full border-2 ${m.userId === userId ? 'border-[var(--sv-accent)]' : 'border-outline-variant'} p-0.5`}>
                <Avatar url={m.avatar_url} name={m.username} size={36} />
              </div>
              <span className="text-[9px] text-on-surface-variant mt-0.5 truncate w-12 text-center">{m.userId === userId ? 'YOU' : m.username}</span>
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
        <ChatArea messages={chatMessages} userId={userId} onSend={sendMessage} />

        {/* Active duel */}
        <AnimatePresence>
          {activeDuel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
              <DuelCard duel={activeDuel} onAccept={acceptChallenge} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </Layout>
  )
}

function ChatArea({ messages, userId, onSend }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 mt-2">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-6 text-outline text-sm">No messages yet — say something!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? 'bg-[var(--sv-accent)] text-white' : 'bg-[#f0f0f0] text-[#1a1a1a]'}`}>
                {!isMe && <div className="text-[10px] font-comic opacity-70 mb-0.5">{msg.username}</div>}
                <div className="text-sm">{msg.message}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 shrink-0">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message…" maxLength={500}
          className="flex-1 bg-[#f8f8f8] border border-[#e0e0e0] rounded-full px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[var(--sv-accent)] focus:outline-none" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-[var(--sv-accent)] text-white flex items-center justify-center disabled:opacity-40">
          <span className="material-symbols-outlined text-[18px]">send</span>
        </motion.button>
      </div>
    </div>
  )
}
