import { motion } from 'framer-motion'
import Avatar from './Avatar.jsx'

export default function LeaderboardRow({ rank, entry, isMe }) {
  return (
    <motion.div
      layout
      className={`p-3 flex items-center gap-3 rounded-DEFAULT border transition-colors ${
        isMe
          ? 'bg-surface-bright border-primary-container shadow-[0_0_15px_rgba(216,207,188,0.15)]'
          : 'bg-surface-container-low border-outline-variant hover:bg-surface-container'
      }`}
    >
      <div className={`w-7 text-center font-label-caps text-label-caps ${isMe ? 'text-primary-container' : 'text-outline'}`}>#{rank}</div>
      <div className="shrink-0">
        <Avatar url={entry.avatar_url} name={entry.username} size={36} />
      </div>
      <div className="flex-grow flex flex-col min-w-0">
        <span className={`font-body-md text-body-md truncate ${isMe ? 'text-primary-container font-semibold' : 'text-on-surface'}`}>{isMe ? 'YOU' : entry.username}</span>
        {entry.tier && <span className="font-label-caps text-[10px] text-outline">{entry.tier.toUpperCase()}</span>}
      </div>
      <div className="font-body-md font-semibold tabular-nums">{(entry.points_total ?? 0).toLocaleString()}</div>
    </motion.div>
  )
}
