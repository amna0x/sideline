import { useState, useEffect } from 'react'
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
  const { squad, joinSquad, leaveSquad, sendReaction, sendChallenge, acceptChallenge } = useSquad()
  const squadMembers = useStore((s) => s.squadMembers)
  const activeDuel = useStore((s) => s.activeDuel)
  const userId = useStore((s) => s.user?.id)
  const [rooms, setRooms] = useState([])
  const [joinName, setJoinName] = useState('')
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

  if (!squad) {
    return (
      <Layout title="SQUAD">
        <section className="px-4 pt-6 relative overflow-hidden">
          <ReactionBurst />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <span className="text-5xl mb-3 block">🎯</span>
            <h1 className="font-comic text-4xl text-primary-container chromatic mb-2" data-text="SQUAD UP">SQUAD UP</h1>
            <p className="text-on-surface-variant text-sm">Join a room, react together, duel your friends</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="comic-panel p-4 mb-4"
          >
            <label className="font-comic text-sm text-[var(--sv-accent)] mb-2 block">CREATE OR JOIN</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin(joinName)}
                placeholder="Squad name…"
                maxLength={24}
                className="flex-1 bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface font-body placeholder:text-outline focus:border-[var(--sv-accent)] focus:outline-none transition-colors"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleJoin(joinName)}
                disabled={!joinName.trim()}
                className="px-5 py-3 rounded-xl font-comic text-base bg-[var(--sv-accent)] text-background shadow-comic-sm disabled:opacity-40 disabled:shadow-none"
              >GO</motion.button>
            </div>
          </motion.div>

          {rooms.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-comic text-sm text-[var(--sv-accent)] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">groups</span>
                ACTIVE ROOMS
              </h2>
              <div className="space-y-2">
                {rooms.map((r) => (
                  <motion.button
                    key={r.id}
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleJoin(r.name)}
                    className="w-full comic-panel p-3 flex items-center justify-between text-left"
                  >
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

          {loadingRooms && (
            <div className="text-center py-8">
              <span className="font-comic text-outline">Loading rooms…</span>
            </div>
          )}

          {!loadingRooms && rooms.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-8"
            >
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
      <section className="px-4 pt-4 relative overflow-hidden">
        <ReactionBurst />
        {/* Room header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="comic-panel p-4 mb-4 speed-lines"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="font-comic text-2xl text-primary-container chromatic" data-text={squad.name}>{squad.name}</h2>
              <span className="text-xs text-on-surface-variant">{squadMembers.length} member{squadMembers.length !== 1 ? 's' : ''} watching</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={leaveSquad}
              className="px-3 py-1.5 rounded-lg font-comic text-xs border-2 border-error/40 text-error hover:bg-error/10 transition-colors"
            >LEAVE</motion.button>
          </div>
        </motion.div>

        {/* Members */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
          <AnimatePresence>
            {squadMembers.map((m) => (
              <motion.div
                key={m.userId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="flex flex-col items-center min-w-[56px]"
              >
                <div className={`rounded-full border-2 ${m.userId === userId ? 'border-[var(--sv-accent)]' : 'border-outline-variant'} p-0.5`}>
                  <Avatar url={m.avatar_url} name={m.username} size={40} />
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 truncate w-14 text-center">{m.userId === userId ? 'YOU' : m.username}</span>
                {m.userId !== userId && (
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => sendChallenge(m.userId, null)}
                    className="text-[9px] font-comic text-[var(--sv-accent)] mt-0.5"
                  >⚔️</motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Reactions bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 py-3"
        >
          {REACTIONS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.2, y: -4 }}
              whileTap={{ scale: 0.8, rotate: Math.random() > 0.5 ? 10 : -10 }}
              onClick={() => sendReaction(emoji)}
              className="w-12 h-12 rounded-full bg-surface-container-low border-2 border-outline-variant flex items-center justify-center text-2xl hover:border-[var(--sv-accent)] transition-colors shadow-comic-sm active:shadow-none"
            >{emoji}</motion.button>
          ))}
        </motion.div>

        {/* Active duel */}
        <AnimatePresence>
          {activeDuel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <DuelCard
                duel={activeDuel}
                onAccept={acceptChallenge}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Squad activity placeholder */}
        <div className="comic-panel p-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[var(--sv-accent)] text-[16px]">bolt</span>
            <span className="font-comic text-sm text-[var(--sv-accent)]">SQUAD FEED</span>
          </div>
          <div className="text-center py-6">
            <span className="text-3xl mb-2 block">🎉</span>
            <p className="font-comic text-on-surface-variant text-sm">React to the match together!</p>
            <p className="text-xs text-outline mt-1">Tap an emoji above or challenge a squadmate to a duel</p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
