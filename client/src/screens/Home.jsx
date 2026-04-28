import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import Layout from '../components/Layout.jsx'
import MatchHero from '../components/MatchHero.jsx'
import { useMatch } from '../hooks/useMatch.js'
import { useStore } from '../store/index.js'

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

      <section className="px-4 mt-4">
        <SectionHeader icon="thermostat" title="GAME TEMPERATURE" />
        <div className="bg-surface-container-low border border-[#565449] rounded-2xl p-4">
          <div className="flex items-end justify-between mb-2">
            <span className="font-h3 text-h3 text-on-background">{tempLabel(temp)}</span>
            <span className="font-label-caps text-label-caps text-primary-container">{Math.round(temp)}%</span>
          </div>
          <div className="h-2 w-full bg-[#11120D] rounded-full overflow-hidden border border-[#565449]">
            <div className="h-full bg-[#D8CFBC] transition-all duration-700"
                 style={{ width: `${temp}%`, boxShadow: `0 0 ${10 + temp / 5}px rgba(216,207,188,${0.4 + temp / 250})` }} />
          </div>
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionHeader icon="map" title="TACTICAL HEATMAP" />
        <div className="bg-surface-container-low border border-[#565449] rounded-2xl p-3 h-[220px] relative overflow-hidden">
          <Pitch zones={pulse} home={match?.home_team} away={match?.away_team} />
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionHeader icon="show_chart" title="MOMENTUM" />
        <div className="bg-surface-container-low border border-[#565449] rounded-2xl p-3 h-[140px]">
          {momentum.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={momentum}>
                <YAxis hide domain={[-10, 10]} />
                <Line type="monotone" dataKey="v" stroke="#d8cfbc" strokeWidth={2.5}
                      dot={false} isAnimationActive={true} animationDuration={400} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-outline font-label-caps text-label-caps">
              {loading ? 'CONNECTING…' : 'AWAITING EVENTS'}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionHeader icon="bolt" title="EVENT FEED" />
        <div className="bg-surface-container-low border border-[#565449] rounded-2xl divide-y divide-outline-variant/40">
          {events.slice(-6).reverse().map((e, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <span className="font-label-caps text-label-caps text-primary-container w-10">{e.minute}'</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{eventIcon(e.type)}</span>
              <span className="text-sm text-on-surface flex-1 truncate">{e.player_name || e.type}</span>
              <span className="font-label-caps text-[10px] text-outline">{e.team}</span>
            </div>
          ))}
          {events.length === 0 && (
            <div className="px-3 py-6 text-center text-outline text-sm">No events yet — simulator idle</div>
          )}
        </div>
      </section>
    </Layout>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="material-symbols-outlined text-[16px] text-outline">{icon}</span>
      <h2 className="font-label-caps text-label-caps text-outline tracking-widest">{title}</h2>
      <div className="flex-1 h-px bg-[#565449]/50" />
    </div>
  )
}

function Pitch({ zones, home, away }) {
  return (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <rect x="0" y="0" width="100" height="60" fill="#0e0f0a" stroke="#565449" strokeWidth="0.3" />
      <line x1="50" y1="0" x2="50" y2="60" stroke="#565449" strokeWidth="0.3" opacity="0.5" />
      <circle cx="50" cy="30" r="7" stroke="#565449" strokeWidth="0.3" fill="none" opacity="0.5" />
      <rect x="0" y="20" width="10" height="20" stroke="#565449" strokeWidth="0.3" fill="none" opacity="0.5" />
      <rect x="90" y="20" width="10" height="20" stroke="#565449" strokeWidth="0.3" fill="none" opacity="0.5" />
      {(zones?.home || defaultZones('home')).map((z, i) => (
        <circle key={`h${i}`} cx={z.x} cy={z.y} r={z.r || 6} fill="#00F6AC" opacity={z.intensity || 0.45}>
          <animate attributeName="r" values={`${(z.r || 6) - 0.5};${(z.r || 6) + 0.5};${(z.r || 6) - 0.5}`} dur="3s" repeatCount="indefinite" />
        </circle>
      ))}
      {(zones?.away || defaultZones('away')).map((z, i) => (
        <circle key={`a${i}`} cx={z.x} cy={z.y} r={z.r || 5} fill="#ffffff" opacity={(z.intensity || 0.3) * 0.6} />
      ))}
      <text x="3" y="58" fill="#959086" fontSize="2.5" fontFamily="Space Grotesk">{home || 'HOME'}</text>
      <text x="97" y="58" fill="#959086" fontSize="2.5" fontFamily="Space Grotesk" textAnchor="end">{away || 'AWAY'}</text>
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
  return 'Intense'
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
    <button onClick={onClick} className="w-full py-3 bg-error/20 border border-error rounded-DEFAULT text-error font-label-caps text-label-caps">RETRY</button>
  </div>
}
