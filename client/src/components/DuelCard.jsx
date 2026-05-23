import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/index.js'

export default function DuelCard({ duel, onAccept, onPick }) {
  if (!duel) return null

  if (duel.status === 'pending' && duel.role === 'opponent') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="comic-panel p-4 border-2 border-[var(--sv-accent)] shadow-neon ink-splat"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-comic text-lg text-[var(--sv-accent)]">DUEL CHALLENGE</span>
        </div>
        <p className="text-on-surface text-sm mb-3">
          <span className="font-comic text-[var(--sv-cyan)]">{duel.challengerName}</span> challenges you to a prediction duel!
        </p>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAccept?.(duel.duelId)}
            className="flex-1 py-2.5 rounded-xl font-comic text-base bg-[var(--sv-accent)] text-background shadow-comic-sm"
          >ACCEPT</motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => useStore.getState().clearDuel()}
            className="flex-1 py-2.5 rounded-xl font-comic text-base border-2 border-outline-variant text-outline"
          >DECLINE</motion.button>
        </div>
      </motion.div>
    )
  }

  if (duel.status === 'active') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="comic-panel p-4 border-2 border-[var(--sv-cyan)] chromatic-box"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-comic text-lg text-[var(--sv-cyan)]">⚔️ DUEL ACTIVE</span>
          <div className="flex gap-1">
            <span className={`w-3 h-3 rounded-full ${duel.challengerLocked ? 'bg-[var(--sv-accent)]' : 'bg-outline-variant'}`} />
            <span className={`w-3 h-3 rounded-full ${duel.opponentLocked ? 'bg-[var(--sv-cyan)]' : 'bg-outline-variant'}`} />
          </div>
        </div>
        <p className="text-on-surface-variant text-xs font-label-caps mb-1">
          {duel.challengerLocked && duel.opponentLocked ? 'BOTH LOCKED IN — AWAITING RESULT' : 'MAKE YOUR PICK ON THE PREDICTION ABOVE'}
        </p>
      </motion.div>
    )
  }

  if (duel.status === 'resolved') {
    const won = (duel.result === 'challenger_wins' && duel.role === 'challenger') ||
                (duel.result === 'opponent_wins' && duel.role === 'opponent')
    const draw = duel.result === 'draw'
    return (
      <motion.div
        initial={{ scale: 0.8, rotate: -2 }}
        animate={{ scale: 1, rotate: 0 }}
        className={`comic-panel p-4 border-2 ${won ? 'border-[#00f6ac] shadow-[0_0_20px_rgba(0,246,172,0.3)]' : draw ? 'border-[var(--sv-yellow)]' : 'border-error'}`}
      >
        <div className="text-center">
          <span className="font-comic text-3xl">{won ? '🏆' : draw ? '🤝' : '💀'}</span>
          <h3 className="font-comic text-2xl mt-1" style={{ color: won ? '#00f6ac' : draw ? 'var(--sv-yellow)' : 'var(--error)' }}>
            {won ? 'YOU WIN' : draw ? 'DRAW' : 'YOU LOSE'}
          </h3>
          <div className="flex justify-center gap-4 mt-2 text-xs text-on-surface-variant">
            <span>You: <strong className="text-on-surface">{duel.role === 'challenger' ? duel.challengerPick : duel.opponentPick}</strong></span>
            <span>Them: <strong className="text-on-surface">{duel.role === 'challenger' ? duel.opponentPick : duel.challengerPick}</strong></span>
          </div>
          <p className="text-xs text-[var(--sv-accent)] mt-1 font-comic">Correct: {duel.correctAnswer}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => useStore.getState().clearDuel()}
          className="w-full mt-3 py-2 rounded-xl font-comic text-sm border border-outline-variant text-outline"
        >DISMISS</motion.button>
      </motion.div>
    )
  }

  // Waiting/sending state
  return (
    <motion.div
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="comic-panel p-4 border-2 border-outline-variant"
    >
      <span className="font-comic text-sm text-outline">⚔️ Challenge sent — waiting for response…</span>
    </motion.div>
  )
}
