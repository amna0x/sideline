import { motion } from 'framer-motion'

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
      <div className="w-9 h-9 rounded-DEFAULT bg-surface-container-high border border-outline/50 overflow-hidden shrink-0 flex items-center justify-center">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          : <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person</span>}
      </div>
      <div className="flex-grow flex flex-col min-w-0">
        <span className={`font-body-md text-body-md truncate ${isMe ? 'text-primary-container font-semibold' : 'text-on-surface'}`}>{isMe ? 'YOU' : entry.username}</span>
        {entry.tier && <span className="font-label-caps text-[10px] text-outline">{entry.tier.toUpperCase()}</span>}
      </div>
      <div className="font-body-md font-semibold tabular-nums">{(entry.points_total ?? 0).toLocaleString()}</div>
    </motion.div>
  )
}
