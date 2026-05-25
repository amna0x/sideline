import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/index.js'

export default function ReactionBurst() {
  const reactions = useStore((s) => s.reactions)

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {reactions.slice(-8).map((r) => (
          <Burst key={r.id} emoji={r.emoji} username={r.username} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function Burst({ emoji, username }) {
  const x = 20 + Math.random() * 50 // 20-70% to stay within bounds
  const rotate = -15 + Math.random() * 30

  return (
    <motion.div
      initial={{ bottom: '10%', left: `${x}%`, scale: 0.5, opacity: 1, rotate: 0 }}
      animate={{ bottom: '80%', scale: 1.4, opacity: 0, rotate }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%` }}
    >
      <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{emoji}</span>
      <span className="font-comic text-xs text-white/60 mt-1 whitespace-nowrap">{username}</span>
    </motion.div>
  )
}
