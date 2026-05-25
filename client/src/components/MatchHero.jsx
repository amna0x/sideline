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
        <div className="flex items-center justify-between relative z-10">
          <TeamLabel name={match.home_team} crest={match.home_crest} />
          <motion.div
            key={`${match.home_score}-${match.away_score}`}
            initial={{ scale: 2, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="font-comic text-[64px] leading-none text-primary-container chromatic drop-shadow-[0_0_20px_rgba(216,207,188,0.3)] tabular-nums"
            data-text={`${match.home_score}–${match.away_score}`}
          >{match.home_score}–{match.away_score}</motion.div>
          <TeamLabel name={match.away_team} crest={match.away_crest} align="right" />
        </div>
        <p className="mt-3 text-center text-xs text-on-surface-variant font-marker">{match.stadium}</p>
      </div>
    </section>
  )
}

function TeamLabel({ name, crest, align = 'left' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: align === 'right' ? 3 : -3 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-surface-container-highest border-2 border-outline-variant flex items-center justify-center shadow-comic-sm overflow-hidden"
      >
        {crest ? (
          <img src={crest} alt={name} className="w-10 h-10 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
        ) : null}
        <span className={`font-comic text-lg text-primary-container ${crest ? 'hidden' : 'flex'}`} style={crest ? { display: 'none' } : {}}>
          {name?.slice(0, 3).toUpperCase()}
        </span>
      </motion.div>
      <span className="font-label-caps text-label-caps text-on-surface-variant mt-1.5 truncate max-w-[100px]">{name}</span>
    </div>
  )
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
