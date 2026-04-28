import { useEffect, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import LeaderboardRow from '../components/LeaderboardRow.jsx'
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
        <h1 className="font-h2 text-h2 text-primary-container text-center mb-4">LEADERBOARD</h1>

        <div className="flex p-1 bg-surface-container-low border border-outline-variant rounded-full mb-5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setScope(t.key)}
              className={`flex-1 py-2 rounded-full font-label-caps text-label-caps transition-all ${
                scope === t.key ? 'bg-surface-bright text-primary-container shadow-[0_0_12px_rgba(216,207,188,0.15)]' : 'text-outline'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-14 bg-surface-container-low rounded animate-pulse" />)}</div>
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[360px] bg-surface-bright border border-primary-container p-3 rounded-DEFAULT flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container rounded-l" />
          <div className="w-9 text-center font-label-caps text-label-caps text-primary-container">#{myRank.rank}</div>
          <div className="flex-grow flex flex-col">
            <span className="font-body-md text-body-md text-primary-container font-semibold">YOU</span>
            <span className="font-label-caps text-[10px] text-outline">{myRank.to_next ? `${myRank.to_next.toLocaleString()} TO NEXT` : ''}</span>
          </div>
          <div className="font-h3 text-primary-container tabular-nums">{(myRank.points_total ?? 0).toLocaleString()}</div>
        </div>
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
    <div className="flex flex-col items-center pb-2">
      <div className="relative mb-2">
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded font-label-caps text-label-caps z-10 ${
          winner ? 'bg-primary-container text-background shadow-[0_0_12px_rgba(216,207,188,0.5)]' : 'bg-surface-container-high border border-outline-variant text-on-surface'
        }`}>#{rank}</div>
        <div className={`${px} rounded-full border-2 ${winner ? 'border-primary-container' : 'border-outline-variant'} p-1 bg-surface-container-low`}>
          {entry?.avatar_url
            ? <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-outline">person</span></div>}
        </div>
      </div>
      <div className={`font-body-md ${winner ? 'text-primary-container font-bold' : 'text-on-surface'} truncate w-full text-center`}>{entry?.username || '—'}</div>
      <div className="font-label-caps text-label-caps text-outline tabular-nums">{(entry?.points_total ?? 0).toLocaleString()}</div>
    </div>
  )
}
