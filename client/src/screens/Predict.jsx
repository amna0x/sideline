import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import PredictionCard from '../components/PredictionCard.jsx'
import LeaderboardRow from '../components/LeaderboardRow.jsx'
import MatchHero from '../components/MatchHero.jsx'
import { useMatch } from '../hooks/useMatch.js'
import { usePredictions } from '../hooks/usePredictions.js'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'

export default function Predict() {
  const { match } = useMatch()
  const { active, upcoming, submissions, loading, submit } = usePredictions(match?.id)
  const [top, setTop] = useState([])
  const userId = useStore((s) => s.user?.id)
  const isGuest = useStore((s) => s.isGuest)
  const showToast = useStore((s) => s.showToast)
  const bumpGuest = useStore((s) => s.bumpGuest)
  const guestInteractions = useStore((s) => s.guestInteractions)

  useEffect(() => {
    if (!match?.id) return
    const tick = () => api.leaderboard('match', match.id).then((rows) => setTop((rows || []).slice(0, 5))).catch(() => {})
    tick()
    const t = setInterval(tick, 60000)
    return () => clearInterval(t)
  }, [match?.id])

  async function onSelect(p, opt) {
    if (isGuest) {
      bumpGuest()
      if (guestInteractions >= 2) { showToast('Sign up to lock in predictions'); return }
    }
    try { await submit(p, opt) }
    catch (e) { showToast(e.message || 'submit failed') }
  }

  return (
    <Layout title="PREDICT & EARN">
      <MatchHero match={match} />

      <section className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary-container text-[18px]">radar</span>
          <h2 className="font-h3 text-h3 text-primary-container">ACTIVE</h2>
        </div>

        {loading && <SkeletonCard />}
        {!loading && active.length === 0 && <Empty />}

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden" animate="show"
          className="space-y-4"
        >
          {active.map((p) => (
            <motion.div key={p.id}
              variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
              <PredictionCard
                prediction={p}
                selected={submissions[p.id]}
                onSelect={(opt) => onSelect(p, opt)}
                locked={!!submissions[p.id] || !!p.correct_answer}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {upcoming.length > 0 && (
        <section className="px-4 mt-6">
          <div className="flex justify-between items-end mb-3 border-b border-outline-variant pb-2">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">UPCOMING QUEUE</h2>
            <span className="font-label-caps text-label-caps text-outline">{upcoming.length} EVENTS</span>
          </div>
          <div className="space-y-3">
            {upcoming.map((p) => (
              <div key={p.id} className="bg-surface-container border border-outline-variant rounded-DEFAULT p-3 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
                  </div>
                  <div>
                    <div className="font-body-md text-body-md text-on-surface">{p.question}</div>
                    <div className="font-label-caps text-[10px] text-outline">{(p.type || '').replace('_', ' ').toUpperCase()}</div>
                  </div>
                </div>
                <span className="font-label-caps text-label-caps text-primary-container">UNLOCKS {timeUntil(p.opens_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary-container text-[16px]">bar_chart</span>
          <h2 className="font-label-caps text-label-caps text-primary-container tracking-widest">LIVE STANDINGS</h2>
        </div>
        <div className="space-y-2">
          {top.length > 0
            ? top.map((row, i) => <LeaderboardRow key={row.user_id || i} rank={i + 1} entry={row} isMe={row.user_id === userId} />)
            : <div className="text-center text-outline text-sm py-4">Standings warming up…</div>}
        </div>
      </section>
    </Layout>
  )
}

function timeUntil(iso) {
  if (!iso) return 'SOON'
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'NOW'
  const m = Math.floor(ms / 60000)
  return m > 0 ? `${m}M` : '<1M'
}
function SkeletonCard() {
  return <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 animate-pulse h-40" />
}
function Empty() {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 text-center">
      <span className="material-symbols-outlined text-outline text-[36px]">hourglass_empty</span>
      <div className="font-label-caps text-label-caps text-outline mt-2">NO ACTIVE PREDICTIONS</div>
    </div>
  )
}
