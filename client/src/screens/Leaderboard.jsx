import { useEffect, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import LeaderboardRow from '../components/LeaderboardRow.jsx'
import HeaderArtCard from '../components/HeaderArtCard.jsx'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'
import { useSocket } from '../hooks/useSocket.js'
import { useMatch } from '../hooks/useMatch.js'

const TABS = [
  { key: 'match', label: 'THIS MATCH' },
  { key: 'month', label: 'THIS MONTH' },
  { key: 'all', label: 'ALL TIME' }
]

export default function Leaderboard() {
  const [scope, setScope] = useState('match')
  const [rows, setRows] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const userId = useStore((s) => s.user?.id)
  const { match } = useMatch()

  async function load() {
    setLoading(true)
    try {
      const matchId = scope === 'match' ? match?.id : undefined
      const r = await api.leaderboard(scope, matchId).catch(() => [])
      setRows(r || [])
      if (userId) api.myRank(userId, scope).then(setMyRank).catch(() => {})
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [scope, match?.id, userId])

  useSocket({ 'leaderboard:update': () => load() })

  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3, 20)

  return (
    <Layout title="LEADERBOARD">
      <section className="px-4 pt-4">
        <HeaderArtCard
          variant="world"
          eyebrow="Global chase"
          title="Leaderboard"
          sub="Climb the table across matchday, month, and all time."
          className="mb-4"
        />

        <div className="flex p-1 bg-surface-container-low border-2 border-outline-variant/60 rounded-full mb-5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setScope(t.key)}
              className={`flex-1 py-2.5 rounded-full font-comic text-sm transition-all ${
                scope === t.key ? 'bg-[var(--sv-accent)] text-background shadow-comic-sm' : 'text-outline hover:text-on-surface'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-14 comic-panel animate-pulse" />)}</div>
        ) : (
          <>
            {top3.length >= 3 && <Podium rows={top3} />}
            <LayoutGroup>
              <motion.div layout className="space-y-2 mt-4 pb-32">
                {rest.map((row, i) => (
                  <LeaderboardRow key={row.user_id || i} rank={i + 4} entry={row} isMe={row.user_id === userId} />
                ))}
              </motion.div>
            </LayoutGroup>
          </>
        )}
      </section>

      {myRank && myRank.rank > 20 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[360px] comic-panel border-2 border-[var(--sv-accent)] p-3 flex items-center gap-3 shadow-neon"
        >
          <div className="w-9 text-center font-comic text-lg text-[var(--sv-accent)]">#{myRank.rank}</div>
          <div className="flex-grow flex flex-col">
            <span className="font-comic text-base text-[var(--sv-accent)]">YOU</span>
            <span className="font-label-caps text-[10px] text-outline">{myRank.to_next ? `${myRank.to_next.toLocaleString()} TO NEXT` : ''}</span>
          </div>
          <div className="font-comic text-xl text-[var(--sv-accent)] tabular-nums">{(myRank.points_total ?? 0).toLocaleString()}</div>
        </motion.div>
      )}
    </Layout>
  )
}

function Podium({ rows }) {
  const [a, b, c] = [rows[1], rows[0], rows[2]]
  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      <PodiumPlace entry={a} rank={2} size="md" />
      <PodiumPlace entry={b} rank={1} size="lg" winner />
      <PodiumPlace entry={c} rank={3} size="sm" />
    </div>
  )
}

function PodiumPlace({ entry, rank, size, winner }) {
  const px = { sm: 'w-16 h-16', md: 'w-20 h-20', lg: 'w-24 h-24' }[size]
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: rank * 0.1 }}
      className="flex flex-col items-center pb-2"
    >
      <div className="relative mb-2">
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg font-comic text-sm z-10 ${
          winner ? 'bg-[var(--sv-accent)] text-background shadow-comic-sm' : 'bg-surface-container-high border-2 border-outline-variant text-on-surface'
        }`}>#{rank}</div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: winner ? 3 : 0 }}
          className={`${px} rounded-full border-3 ${winner ? 'border-[var(--sv-accent)] shadow-neon-sm' : 'border-outline-variant'} p-1 bg-surface-container-low`}
        >
          {entry?.avatar_url
            ? <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-outline">person</span></div>}
        </motion.div>
      </div>
      <div className={`font-comic text-base ${winner ? 'text-[var(--sv-accent)]' : 'text-on-surface'} truncate w-full text-center`}>{entry?.username || '—'}</div>
      <div className="font-label-caps text-label-caps text-outline tabular-nums">{(entry?.points_total ?? 0).toLocaleString()}</div>
    </motion.div>
  )
}
