import { motion } from 'framer-motion'

export default function PredictionCard({ prediction, selected, onSelect, locked }) {
  const resolved = !!prediction.correct_answer
  const opts = prediction.options || []
  return (
    <div className="relative" style={{ perspective: 1000 }}>
      <motion.div
        animate={{ rotateY: resolved ? 180 : 0 }}
        transition={{ duration: 0.7, type: 'spring', damping: 14 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Front */}
        <div className="bg-surface-container-low border border-[#565449] rounded-2xl p-5 shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-container text-[16px]">radar</span>
            <span className="font-label-caps text-label-caps text-primary-container">{(prediction.type || 'PREDICTION').replace('_', ' ').toUpperCase()}</span>
          </div>
          <h3 className="font-h3 text-h3 text-on-surface mb-4">{prediction.question}</h3>
          <div className="grid grid-cols-2 gap-3">
            {opts.map((opt) => {
              const isSel = selected === opt
              return (
                <button
                  key={opt}
                  disabled={locked}
                  onClick={() => onSelect?.(opt)}
                  className={`relative rounded-xl p-3 text-center transition-all border ${
                    isSel
                      ? 'border-primary-container bg-primary-container/10 text-primary-container shadow-[0_0_15px_rgba(216,207,188,0.3)]'
                      : locked
                        ? 'border-outline-variant bg-surface-container text-on-surface-variant opacity-50'
                        : 'border-outline-variant bg-surface-container hover:border-primary-container/50 text-on-surface'
                  }`}
                >
                  <span className="block font-body-lg text-body-lg font-medium">{opt}</span>
                  {isSel && <span className="material-symbols-outlined absolute top-1 right-1 text-primary-container text-[16px]">check_circle</span>}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-xs text-on-surface-variant font-label-caps">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{closesIn(prediction.closes_at)}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{prediction.submission_count ?? 0}</span>
          </div>
        </div>
        {/* Back (reveal) */}
        <div className="absolute inset-0 bg-surface-container-low border border-primary-container rounded-2xl p-5 shadow-[0_0_30px_rgba(216,207,188,0.3)] flex flex-col justify-center text-center"
             style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <span className="font-label-caps text-label-caps text-primary-container mb-2">CORRECT ANSWER</span>
          <h3 className="font-h2 text-h2 text-primary mb-4">{prediction.correct_answer}</h3>
          {selected && (
            <span className={`font-label-caps text-label-caps ${selected === prediction.correct_answer ? 'text-primary-container' : 'text-error'}`}>
              {selected === prediction.correct_answer ? 'YOU GOT IT' : `YOU PICKED ${selected}`}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function closesIn(iso) {
  if (!iso) return 'OPEN'
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'CLOSED'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}M ${s % 60}S` : `${s}S`
}
