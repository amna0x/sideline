import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/index.js'

export default function ReactionBurst() {
  const reactions = useStore((s) => s.reactions)

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {reactions.slice(-8).map((r) => (
          <Burst key={r.id} emoji={r.emoji} username={r.username} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function Burst({ emoji, username }) {
  const x = 20 + Math.random() * 60 // random horizontal position (20-80%)
  const rotate = -15 + Math.random() * 30

  return (
    <motion.div
      initial={{ y: '80vh', x: `${x}%`, scale: 0.5, opacity: 1, rotate: 0 }}
      animate={{ y: '-10vh', scale: 1.6, opacity: 0, rotate }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute flex flex-col items-center"
    >
      <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{emoji}</span>
      <span className="font-comic text-xs text-white/60 mt-1 whitespace-nowrap">{username}</span>
    </motion.div>
  )
}
