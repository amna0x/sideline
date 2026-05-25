import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import MatchHero from '../components/MatchHero.jsx'
import { useMatch } from '../hooks/useMatch.js'
import { useStore } from '../store/index.js'

const stagger = { show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { y: 24, opacity: 0 }, show: { y: 0, opacity: 1 } }

export default function Home() {
  const { match, loading, reload, error } = useMatch()
  const events = useStore((s) => s.matchEvents)
  const pulse = useStore((s) => s.pulse)

  const momentum = useMemo(() => {
    const last = events.slice(-10)
    return last.map((e, i) => ({ i, v: scoreEvent(e) }))
  }, [events])

  const temp = useMemo(() => {
    const recent = events.filter((e) => Date.now() - new Date(e.created_at).getTime() < 5 * 60 * 1000)
    const score = (recent.length * 12)
    return Math.min(100, score)
  }, [events])

  return (
    <Layout title="LIVE PULSE">
      <div className="absolute inset-0 tactical-grid pointer-events-none -z-10" />
      <MatchHero match={match} />
      {error && <Retry onClick={reload} />}

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 px-4 mt-4">
        <motion.section variants={fadeUp}>
          <SectionHeader icon="thermostat" title="GAME TEMPERATURE" />
          <div className="comic-panel p-4">
            <div className="flex items-end justify-between mb-3">
              <span className="font-comic text-2xl text-on-background">{tempLabel(temp)}</span>
              <span className="font-comic text-lg text-[var(--sv-accent)]">{Math.round(temp)}%</span>
            </div>
            <div className="h-3 w-full bg-[#11120D] rounded-full overflow-hidden border-2 border-outline-variant/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${temp}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, var(--sv-cyan), var(--sv-accent))`,
                  boxShadow: `0 0 ${10 + temp / 3}px var(--sv-accent)`
                }}
              />
            </div>
          </div>
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader icon="map" title="TACTICAL HEATMAP" />
          <div className="comic-panel p-3 h-[220px] relative overflow-hidden">
            <Pitch zones={pulse} home={match?.home_team} away={match?.away_team} />
          </div>
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader icon="show_chart" title="MOMENTUM" />
          <div className="comic-panel p-3 h-[140px]">
            {momentum.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={momentum}>
                  <YAxis hide domain={[-10, 10]} />
                  <Line type="monotone" dataKey="v" stroke="var(--sv-accent)" strokeWidth={3}
                        dot={false} isAnimationActive={true} animationDuration={600} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-outline font-comic text-lg">
                {loading ? 'CONNECTING…' : 'AWAITING EVENTS'}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader icon="bar_chart" title="TEAM STATS" />
          <TeamStats events={events} match={match} />
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader icon="person" title="PLAYER STATS" />
          <PlayerStats events={events} />
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader icon="bolt" title="EVENT FEED" />
          <div className="comic-panel divide-y divide-outline-variant/30">
            {events.slice(-6).reverse().map((e, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="font-comic text-sm text-[var(--sv-accent)] w-10">{e.minute}'</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{eventIcon(e.type)}</span>
                <span className="text-sm text-on-surface flex-1 truncate">{e.player_name || e.type}</span>
                <span className="font-label-caps text-[10px] text-outline">{e.team}</span>
              </motion.div>
            ))}
            {events.length === 0 && (
              <div className="px-4 py-8 text-center text-outline font-comic text-lg">No events yet — simulator idle</div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </Layout>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="material-symbols-outlined text-[16px] text-[var(--sv-accent)]">{icon}</span>
      <h2 className="font-comic text-base text-[var(--sv-accent)] tracking-wide">{title}</h2>
      <div className="flex-1 h-px bg-[var(--sv-accent)]/20" />
    </div>
  )
}

function Pitch({ zones, home, away }) {
  return (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <rect x="0" y="0" width="100" height="60" fill="#0e0f0a" stroke="var(--sv-accent)" strokeWidth="0.4" opacity="0.6" />
      <line x1="50" y1="0" x2="50" y2="60" stroke="#565449" strokeWidth="0.3" opacity="0.5" />
      <circle cx="50" cy="30" r="7" stroke="#565449" strokeWidth="0.3" fill="none" opacity="0.5" />
      <rect x="0" y="20" width="10" height="20" stroke="#565449" strokeWidth="0.3" fill="none" opacity="0.5" />
      <rect x="90" y="20" width="10" height="20" stroke="#565449" strokeWidth="0.3" fill="none" opacity="0.5" />
      {(zones?.home || defaultZones('home')).map((z, i) => (
        <circle key={`h${i}`} cx={z.x} cy={z.y} r={z.r || 6} fill="var(--sv-cyan)" opacity={z.intensity || 0.5}>
          <animate attributeName="r" values={`${(z.r || 6) - 0.5};${(z.r || 6) + 1};${(z.r || 6) - 0.5}`} dur="2.5s" repeatCount="indefinite" />
        </circle>
      ))}
      {(zones?.away || defaultZones('away')).map((z, i) => (
        <circle key={`a${i}`} cx={z.x} cy={z.y} r={z.r || 5} fill="var(--sv-accent)" opacity={(z.intensity || 0.3) * 0.7} />
      ))}
      <text x="3" y="58" fill="var(--sv-cyan)" fontSize="3" fontFamily="Bangers">{home || 'HOME'}</text>
      <text x="97" y="58" fill="var(--sv-accent)" fontSize="3" fontFamily="Bangers" textAnchor="end">{away || 'AWAY'}</text>
    </svg>
  )
}

function defaultZones(side) {
  if (side === 'home') return [{ x: 25, y: 30, r: 8 }, { x: 35, y: 18, r: 5 }, { x: 32, y: 42, r: 6 }]
  return [{ x: 75, y: 30, r: 7 }, { x: 65, y: 22, r: 4 }, { x: 70, y: 42, r: 5 }]
}

function tempLabel(t) {
  if (t < 25) return 'Quiet'
  if (t < 50) return 'Active'
  if (t < 75) return 'Heated'
  return 'INTENSE'
}
function scoreEvent(e) {
  const map = { goal: 10, red_card: 6, yellow_card: 2, var: 4, corner: 1, substitution: 1 }
  return (map[e.type] || 1) * (e.team === 'home' ? 1 : -1)
}
function eventIcon(t) {
  switch (t) {
    case 'goal': return 'sports_soccer'
    case 'yellow_card': return 'square'
    case 'red_card': return 'crop_din'
    case 'corner': return 'flag'
    case 'var': return 'visibility'
    case 'substitution': return 'sync_alt'
    default: return 'circle'
  }
}
function Retry({ onClick }) {
  return <div className="px-4 mt-4">
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-full py-3 bg-error/20 border-2 border-error rounded-xl text-error font-comic text-lg shadow-comic-sm"
    >RETRY</motion.button>
  </div>
}

function TeamStats({ events, match }) {
  const home = events.filter((e) => e.team === 'home')
  const away = events.filter((e) => e.team === 'away')

  const stats = [
    { label: 'Goals', home: home.filter((e) => e.type === 'goal').length, away: away.filter((e) => e.type === 'goal').length },
    { label: 'Yellow Cards', home: home.filter((e) => e.type === 'yellow_card').length, away: away.filter((e) => e.type === 'yellow_card').length },
    { label: 'Red Cards', home: home.filter((e) => e.type === 'red_card').length, away: away.filter((e) => e.type === 'red_card').length },
    { label: 'Corners', home: home.filter((e) => e.type === 'corner').length, away: away.filter((e) => e.type === 'corner').length },
    { label: 'Substitutions', home: home.filter((e) => e.type === 'substitution').length, away: away.filter((e) => e.type === 'substitution').length }
  ]

  return (
    <div className="comic-panel p-4">
      <div className="flex justify-between items-center mb-3 text-xs font-comic">
        <span className="text-[var(--sv-cyan)] truncate max-w-[100px]">{match?.home_team || 'HOME'}</span>
        <span className="text-[#999]">VS</span>
        <span className="text-[var(--sv-accent)] truncate max-w-[100px] text-right">{match?.away_team || 'AWAY'}</span>
      </div>
      <div className="space-y-3">
        {stats.map((s) => {
          const total = s.home + s.away
          const homePct = total === 0 ? 50 : (s.home / total) * 100
          return (
            <div key={s.label}>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-comic tabular-nums text-[var(--sv-cyan)]">{s.home}</span>
                <span className="text-[#999]">{s.label}</span>
                <span className="font-comic tabular-nums text-[var(--sv-accent)]">{s.away}</span>
              </div>
              <div className="h-1.5 w-full bg-[#f0f0f0] rounded-full overflow-hidden flex">
                <div className="h-full bg-[var(--sv-cyan)] transition-all" style={{ width: `${homePct}%` }} />
                <div className="h-full bg-[var(--sv-accent)] transition-all" style={{ width: `${100 - homePct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlayerStats({ events }) {
  // Aggregate events per player
  const players = {}
  for (const e of events) {
    if (!e.player_name) continue
    if (!players[e.player_name]) {
      players[e.player_name] = { name: e.player_name, team: e.team, goals: 0, yellows: 0, reds: 0, total: 0 }
    }
    const p = players[e.player_name]
    if (e.type === 'goal') p.goals++
    else if (e.type === 'yellow_card') p.yellows++
    else if (e.type === 'red_card') p.reds++
    p.total++
  }

  const list = Object.values(players).sort((a, b) => b.goals - a.goals || b.total - a.total).slice(0, 6)

  if (list.length === 0) {
    return (
      <div className="comic-panel p-6 text-center">
        <span className="text-sm text-[#999]">No player stats yet</span>
      </div>
    )
  }

  return (
    <div className="comic-panel divide-y divide-[#f0f0f0]">
      {list.map((p) => (
        <div key={p.name} className="flex items-center gap-3 p-3">
          <span className={`w-1 h-8 rounded-full ${p.team === 'home' ? 'bg-[var(--sv-cyan)]' : 'bg-[var(--sv-accent)]'}`} />
          <span className="text-sm text-[#1a1a1a] flex-1 truncate">{p.name}</span>
          {p.goals > 0 && <span className="flex items-center gap-1 text-xs text-[#1a1a1a]"><span>⚽</span>{p.goals}</span>}
          {p.yellows > 0 && <span className="flex items-center gap-1 text-xs text-[#1a1a1a]"><span className="w-2 h-3 bg-yellow-400 rounded-sm" />{p.yellows}</span>}
          {p.reds > 0 && <span className="flex items-center gap-1 text-xs text-[#1a1a1a]"><span className="w-2 h-3 bg-red-500 rounded-sm" />{p.reds}</span>}
        </div>
      ))}
    </div>
  )
}
