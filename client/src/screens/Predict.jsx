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

const stagger = { show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { y: 24, opacity: 0 }, show: { y: 0, opacity: 1 } }

export default function Predict() {
  const { match } = useMatch()
  const { active, upcoming, submissions, loading, submit } = usePredictions(match?.id)
  const [top, setTop] = useState([])
  const userId = useStore((s) => s.user?.id)
  const showToast = useStore((s) => s.showToast)

  useEffect(() => {
    if (!match?.id) return
    const tick = () => api.leaderboard('match', match.id).then((rows) => setTop((rows || []).slice(0, 5))).catch(() => {})
    tick()
    const t = setInterval(tick, 15000) // refresh every 15s
    return () => clearInterval(t)
  }, [match?.id, Object.keys(submissions).length]) // re-fetch when user submits

  async function onSelect(p, opt) {
    try { await submit(p, opt) }
    catch (e) {
      // Errors are now handled inside PredictionCard with friendly messages
      // Only show toast for unexpected errors
      if (e.message !== 'already submitted' && e.message !== 'prediction closed' && e.message !== 'not signed in') {
        showToast('Something went wrong')
      }
    }
  }

  return (
    <Layout title="PREDICT">
      <MatchHero match={match} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="px-4 mt-5 space-y-4 pb-32">
        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[var(--sv-accent)] text-[18px]">radar</span>
            <h2 className="font-comic text-xl text-[var(--sv-accent)]">ACTIVE</h2>
          </div>

          {loading && <SkeletonCard />}
          {!loading && active.length === 0 && <Empty />}

          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden" animate="show"
            className="space-y-4"
          >
            {active.map((p) => (
              <motion.div key={p.id}
                variants={{ hidden: { y: 24, opacity: 0, scale: 0.95 }, show: { y: 0, opacity: 1, scale: 1 } }}>
                <PredictionCard
                  prediction={p}
                  selected={submissions[p.id]}
                  onSelect={(opt) => onSelect(p, opt)}
                  locked={!!submissions[p.id] || !!p.correct_answer}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {upcoming.length > 0 && (
          <motion.section variants={fadeUp}>
            <div className="flex justify-between items-end mb-3 border-b-2 border-outline-variant/40 pb-2">
              <h2 className="font-comic text-sm text-on-surface-variant">UPCOMING QUEUE</h2>
              <span className="font-comic text-xs text-outline">{upcoming.length} EVENTS</span>
            </div>
            <div className="space-y-3">
              {upcoming.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ x: 3 }}
                  className="comic-panel p-3 flex items-center justify-between opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest border-2 border-outline-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
                    </div>
                    <div>
                      <div className="font-body-md text-body-md text-on-surface">{p.question}</div>
                      <div className="font-label-caps text-[10px] text-outline">{(p.type || '').replace('_', ' ').toUpperCase()}</div>
                    </div>
                  </div>
                  <span className="font-comic text-xs text-[var(--sv-accent)]">UNLOCKS {timeUntil(p.opens_at)}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[var(--sv-accent)] text-[16px]">bar_chart</span>
            <h2 className="font-comic text-sm text-[var(--sv-accent)]">LIVE STANDINGS</h2>
          </div>
          <div className="space-y-2">
            {top.length > 0
              ? top.map((row, i) => <LeaderboardRow key={row.user_id || i} rank={i + 1} entry={row} isMe={row.user_id === userId} />)
              : <div className="text-center text-outline font-comic text-sm py-4">Standings warming up…</div>}
          </div>
        </motion.section>
      </motion.div>
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
  return <div className="comic-panel p-5 animate-pulse h-40" />
}
function Empty() {
  return (
    <div className="comic-panel p-6 text-center">
      <span className="material-symbols-outlined text-outline text-[36px]">hourglass_empty</span>
      <div className="font-comic text-base text-outline mt-2">NO ACTIVE PREDICTIONS</div>
    </div>
  )
}
