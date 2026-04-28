import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout.jsx'
import { useMatch } from '../hooks/useMatch.js'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'

const QUESTION_SECONDS = 20

export default function Quiz() {
  const { match } = useMatch()
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(QUESTION_SECONDS)
  const [history, setHistory] = useState([])
  const startedAt = useRef(Date.now())
  const addPoints = useStore((s) => s.addPoints)
  const userId = useStore((s) => s.user?.id)

  useEffect(() => {
    if (!match?.id) return
    api.quiz(match.id).then((qs) => setQuestions(qs || [])).catch(() => setQuestions([]))
    api.get(`/api/quiz/${match.id}/history`).then(setHistory).catch(() => setHistory([]))
  }, [match?.id])

  useEffect(() => {
    if (revealed || !questions.length) return
    setSeconds(QUESTION_SECONDS)
    startedAt.current = Date.now()
    const t = setInterval(() => setSeconds((s) => {
      if (s <= 1) { clearInterval(t); reveal(null); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
  }, [idx, questions.length])

  const q = questions[idx]
  const opts = useMemo(() => (q?.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options)) : []), [q])

  async function reveal(answer) {
    if (revealed) return
    setSelected(answer); setRevealed(true)
    const elapsed = (Date.now() - startedAt.current) / 1000
    try {
      const res = await api.submitQuiz({ user_id: userId, question_id: q.id, answer, elapsed_seconds: elapsed })
      if (res?.points_earned) { setScore((s) => s + res.points_earned); addPoints(res.points_earned) }
    } catch {}
  }

  function next() {
    setSelected(null); setRevealed(false)
    setIdx((i) => Math.min(i + 1, questions.length))
  }

  if (!questions.length) {
    return <Layout title="BL IQ"><div className="px-4 pt-10 text-center text-outline">Loading quiz…</div></Layout>
  }

  if (idx >= questions.length) {
    return (
      <Layout title="BL IQ">
        <div className="px-4 pt-8 text-center">
          <h2 className="font-h1 text-h1 text-primary-container">{score}</h2>
          <p className="text-on-surface-variant">Final score · {questions.length} questions</p>
          <button onClick={() => { setIdx(0); setScore(0); setSelected(null); setRevealed(false) }}
                  className="mt-6 px-6 py-3 bg-primary-container text-background rounded-full font-label-caps text-label-caps">PLAY AGAIN</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="BL IQ">
      <section className="px-4 pt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant">QUESTION {idx + 1} / {questions.length}</span>
          <span className="font-label-caps text-label-caps text-primary-container">SCORE: {score}</span>
        </div>
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden mb-5">
          <div className="h-full bg-primary-container shadow-[0_0_10px_rgba(216,207,188,0.5)] transition-all"
               style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>

        <CountdownArc seconds={seconds} max={QUESTION_SECONDS} />

        <div style={{ perspective: 1000 }} className="mt-5">
          <motion.div
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', damping: 16 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative"
          >
            <div className="bg-surface-container-low rounded-2xl p-5 border border-[#565449]" style={{ backfaceVisibility: 'hidden' }}>
              <h2 className="font-h3 text-h3 mb-5">{q.question}</h2>
              <div className="space-y-2">
                {opts.map((opt) => {
                  const isSel = selected === opt
                  return (
                    <button key={opt} onClick={() => reveal(opt)}
                      className={`w-full text-left p-3 rounded border flex items-center justify-between transition-all ${
                        isSel ? 'border-primary-container bg-primary-container/10 text-primary-container shadow-[inset_0_0_15px_rgba(216,207,188,0.1)]'
                              : 'border-[#565449] bg-background text-on-background hover:border-primary-container'
                      }`}>
                      <span>{opt}</span>
                      <span className="material-symbols-outlined text-[18px] text-primary-container">{isSel ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="absolute inset-0 bg-surface-container-low rounded-2xl p-5 border border-primary-container shadow-[0_0_30px_rgba(216,207,188,0.2)] flex flex-col"
                 style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <span className="font-label-caps text-label-caps text-primary-container">CORRECT</span>
              <h3 className="font-h2 text-primary mt-2">{q.correct_answer}</h3>
              {selected && (
                <div className={`mt-2 font-label-caps text-label-caps ${selected === q.correct_answer ? 'text-primary-container' : 'text-error'}`}>
                  {selected === q.correct_answer ? 'CORRECT' : 'INCORRECT'}
                </div>
              )}
              {q.fun_fact && <p className="mt-3 text-on-surface-variant text-sm">{q.fun_fact}</p>}
              <button onClick={next} className="mt-auto py-3 bg-primary-container text-background rounded-full font-label-caps text-label-caps flex items-center justify-center gap-2">
                NEXT <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 mt-6 pb-24">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#565449]" />
          <h3 className="font-label-caps text-label-caps text-outline tracking-widest">FAN IQ TREND</h3>
        </div>
        <div className="bg-surface-container-low rounded border border-[#565449] p-3 h-32">
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.map((h, i) => ({ i, score: h.score }))}>
                <Line type="monotone" dataKey="score" stroke="#d8cfbc" strokeWidth={3} dot={false}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(216,207,188,0.5))' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-outline text-sm">Not enough data yet</div>
          )}
        </div>
      </section>
    </Layout>
  )
}

function CountdownArc({ seconds, max }) {
  const pct = (seconds / max) * 100
  const stroke = pct > 50 ? '#d8cfbc' : pct > 25 ? '#FFD6A5' : '#ffb4ab'
  return (
    <div className="flex justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" stroke="#565449" strokeWidth="2" fill="none" />
          <circle cx="18" cy="18" r="16" stroke={stroke} strokeWidth="2" fill="none"
                  strokeDasharray={`${pct} 100`} strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${stroke})`, transition: 'all 1s linear' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-label-caps text-label-caps text-primary-container">{seconds}s</span>
      </div>
    </div>
  )
}
