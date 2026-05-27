import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function MatchHero({ match }) {
  if (!match) return <SkeletonHero />
  const live = match.status === 'live'
  return (
    <section className="px-4 pt-4">
      <div className="flex items-center gap-2 mb-3">
        {live ? (
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff3b6b]/10 border-2 border-[#ff3b6b]/40 text-[#ff3b6b] font-comic text-sm pulse-glow"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b6b] shadow-[0_0_8px_#ff3b6b] animate-pulse" />
            LIVE {match.minute}'
          </motion.span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container border-2 border-outline-variant text-on-surface-variant font-comic text-sm">
            {match.status?.toUpperCase()}
          </span>
        )}
        <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Bundesliga · MD {match.matchday}</span>
      </div>

      <div className="comic-panel p-5 speed-lines">
        <div className="grid grid-cols-3 items-center relative z-10">
          <div className="flex justify-start">
            <TeamLabel name={match.home_team} logoUrl={match.home_team_logo} />
          </div>
          <motion.div
            key={`${match.home_score}-${match.away_score}`}
            initial={{ scale: 2, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="font-comic text-5xl text-center text-[#1a1a1a] tabular-nums tracking-tighter"
          >{match.home_score}-{match.away_score}</motion.div>
          <div className="flex justify-end">
            <TeamLabel name={match.away_team} logoUrl={match.away_team_logo} align="right" />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[#666] font-marker">{match.stadium}</p>
      </div>
    </section>
  )
}

function TeamLabel({ name, logoUrl, align = 'left' }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [logoUrl])

  const badge = initials(name)

  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: align === 'right' ? 3 : -3 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-black/20 border-2 border-white/10 flex items-center justify-center font-comic text-lg text-[#f7ecdf] shadow-comic-sm overflow-hidden backdrop-blur-sm"
      >
        {logoUrl && !imageFailed ? (
          <img src={logoUrl} alt={name} className="w-9 h-9 object-contain" />
        ) : (
          <span className="text-[18px] leading-none text-[#ffd9c7] drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">{badge}</span>
        )}
      </motion.div>
      <span className="font-comic text-sm text-[#f7ecdf] mt-1.5 text-center leading-tight max-w-[116px] whitespace-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.28)]">
        {name}
      </span>
    </div>
  )
}

function initials(name) {
  if (!name) return 'TM'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function SkeletonHero() {
  return (
    <section className="px-4 pt-4 animate-pulse">
      <div className="h-7 w-32 bg-surface-container-low rounded-full mb-3" />
      <div className="comic-panel p-5">
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-full bg-surface-container-low" />
          <div className="h-14 w-36 bg-surface-container-low rounded" />
          <div className="w-14 h-14 rounded-full bg-surface-container-low" />
        </div>
      </div>
    </section>
  )
}
