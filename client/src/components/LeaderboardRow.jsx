import { motion } from 'framer-motion'
import Avatar from './Avatar.jsx'

export default function LeaderboardRow({ rank, entry, isMe }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`p-3 flex items-center gap-3 rounded-xl border-2 transition-colors ${
        isMe
          ? 'bg-[var(--sv-accent)]/5 border-[var(--sv-accent)]/40 shadow-neon-sm'
          : 'bg-surface-container-low border-outline-variant/60 hover:border-outline-variant shadow-comic-sm'
      }`}
    >
      <div className={`w-8 text-center font-comic text-lg ${isMe ? 'text-[var(--sv-accent)]' : 'text-outline'}`}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </div>
      <div className="shrink-0">
        <Avatar url={entry.avatar_url} name={entry.username} size={36} />
      </div>
      <div className="flex-grow flex flex-col min-w-0">
        <span className={`font-body-md text-body-md truncate ${isMe ? 'text-[var(--sv-accent)] font-semibold' : 'text-on-surface'}`}>{isMe ? 'YOU' : entry.username}</span>
        {entry.tier && <span className="font-label-caps text-[10px] text-outline">{entry.tier.toUpperCase()}</span>}
      </div>
      <div className={`font-comic text-lg tabular-nums ${isMe ? 'text-[var(--sv-accent)]' : 'text-primary-container'}`}>{(entry.points_total ?? 0).toLocaleString()}</div>
    </motion.div>
  )
}
