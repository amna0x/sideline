import { motion } from 'framer-motion'

export default function MatchHero({ match }) {
  if (!match) return <SkeletonHero />
  const live = match.status === 'live'
  return (
    <section className="px-4 pt-4">
      <div className="flex items-center gap-2 mb-2">
        {live ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-high border border-[#565449] text-primary-container font-label-caps text-label-caps">
            <span className="w-2 h-2 rounded-full bg-[#FFFBF4] shadow-[0_0_5px_#FFFBF4] animate-pulse" />
            LIVE {match.minute}'
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
            {match.status?.toUpperCase()}
          </span>
        )}
        <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Bundesliga · MD {match.matchday}</span>
      </div>
      <div className="flex items-center justify-between">
        <TeamLabel name={match.home_team} logoUrl={match.home_team_logo} />
        <motion.div
          key={`${match.home_score}-${match.away_score}`}
          initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="font-h1 text-[56px] leading-none text-primary-container drop-shadow-[0_0_18px_rgba(216,207,188,0.2)] tabular-nums"
        >{match.home_score}–{match.away_score}</motion.div>
        <TeamLabel name={match.away_team} logoUrl={match.away_team_logo} align="right" />
      </div>
      <p className="mt-2 text-center text-xs text-on-surface-variant">{match.stadium}</p>
    </section>
  )
}

function TeamLabel({ name, logoUrl, align = 'left' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-h3 font-bold text-primary-container overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="w-8 h-8 object-contain" />
        ) : (
          name?.slice(0, 3).toUpperCase()
        )}
      </div>
      <span className="font-label-caps text-label-caps text-on-surface-variant mt-1 truncate max-w-[110px]">{name}</span>
    </div>
  )
}

function SkeletonHero() {
  return (
    <section className="px-4 pt-4 animate-pulse">
      <div className="h-6 w-32 bg-surface-container-low rounded mb-3" />
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-full bg-surface-container-low" />
        <div className="h-12 w-32 bg-surface-container-low rounded" />
        <div className="w-12 h-12 rounded-full bg-surface-container-low" />
      </div>
    </section>
  )
}
