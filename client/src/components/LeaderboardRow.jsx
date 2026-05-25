import { motion } from 'framer-motion'
import Avatar, { AdminBadge } from './Avatar.jsx'

export default function LeaderboardRow({ rank, entry, isMe }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`p-3 flex items-center gap-3 rounded-xl border transition-all ${
        isMe
          ? 'bg-[var(--sv-accent)]/5 border-[var(--sv-accent)]/40 shadow-neon-sm'
          : 'bg-white border-[#e0e0e0] hover:border-[#ccc] shadow-comic-sm'
      }`}
    >
      <div className={`w-7 text-center font-comic text-base ${isMe ? 'text-[var(--sv-accent)]' : 'text-[#999]'}`}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </div>
      <div className="shrink-0">
        <Avatar url={entry.avatar_url} name={entry.username} size={36} />
      </div>
      <div className="flex-grow flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm truncate ${isMe ? 'text-[var(--sv-accent)] font-semibold' : 'text-[#1a1a1a]'}`}>
            {isMe ? 'YOU' : entry.username}
          </span>
          <AdminBadge username={entry.username} />
        </div>
        {entry.tier && <span className="text-[10px] text-[#999]">{entry.tier.toUpperCase()}</span>}
      </div>
      <div className={`font-comic text-base tabular-nums ${isMe ? 'text-[var(--sv-accent)]' : 'text-[#1a1a1a]'}`}>
        {(entry.points_total ?? 0).toLocaleString()}
      </div>
    </motion.div>
  )
}
