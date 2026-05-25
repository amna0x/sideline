import { motion } from 'framer-motion'

export default function PredictionCard({ prediction, selected, onSelect, locked }) {
  const resolved = !!prediction.correct_answer
  const opts = prediction.options || []
  const playerImages = prediction.player_images || {}
  const hasPlayerImages = Object.keys(playerImages).length > 0
  return (
    <div className="relative" style={{ perspective: 1200 }}>
      <motion.div
        animate={{ rotateY: resolved ? 180 : 0 }}
        transition={{ duration: 0.8, type: 'spring', damping: 12, stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Front */}
        <div className="comic-panel p-5 ink-splat" style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[var(--sv-accent)] text-[18px]">radar</span>
            <span className="font-comic text-sm text-[var(--sv-accent)] tracking-wide">{(prediction.type || 'PREDICTION').replace('_', ' ').toUpperCase()}</span>
          </div>
          <h3 className="font-comic text-2xl text-on-surface mb-4 leading-tight">{prediction.question}</h3>
          <div className={`grid ${hasPlayerImages ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
            {opts.map((opt) => {
              const isSel = selected === opt
              const playerImg = playerImages[opt]
              return (
                <motion.button
                  key={opt}
                  disabled={locked}
                  onClick={() => onSelect?.(opt)}
                  whileHover={!locked ? { scale: 1.03, rotate: 0.5 } : {}}
                  whileTap={!locked ? { scale: 0.97 } : {}}
                  className={`relative rounded-xl p-2 text-center transition-all border-2 overflow-hidden ${
                    isSel
                      ? 'border-[var(--sv-accent)] bg-[var(--sv-accent)]/10 text-[var(--sv-accent)] shadow-neon-sm'
                      : locked
                        ? 'border-outline-variant bg-surface-container text-on-surface-variant opacity-50'
                        : 'border-outline-variant bg-surface-container hover:border-[var(--sv-accent)]/50 text-on-surface shadow-comic-sm'
                  }`}
                >
                  {playerImg && (
                    <div className="w-10 h-10 rounded-full mx-auto mb-1.5 overflow-hidden border border-white/10">
                      <img src={playerImg} alt={opt} className="w-full h-full object-cover object-top" loading="lazy" onError={(e) => { e.target.parentElement.style.display = 'none' }} />
                    </div>
                  )}
                  <span className="block font-body-lg text-body-lg font-medium text-sm">{opt}</span>
                  {isSel && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="material-symbols-outlined absolute top-1 right-1 text-[var(--sv-accent)] text-[16px] fill-icon"
                    >check_circle</motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-xs text-on-surface-variant font-label-caps">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{closesIn(prediction.closes_at)}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{prediction.submission_count ?? 0}</span>
          </div>
        </div>
        {/* Back (reveal) */}
        <div className="absolute inset-0 comic-panel p-5 flex flex-col justify-center text-center border-2 border-[var(--sv-accent)] shadow-neon"
             style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <span className="font-comic text-sm text-[var(--sv-accent)] mb-2 tracking-wide">CORRECT ANSWER</span>
          <h3 className="font-comic text-4xl text-primary chromatic mb-4" data-text={prediction.correct_answer}>{prediction.correct_answer}</h3>
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`font-comic text-lg ${selected === prediction.correct_answer ? 'text-[#00f6ac]' : 'text-error'}`}
            >
              {selected === prediction.correct_answer ? '✓ NAILED IT' : `✗ YOU PICKED ${selected}`}
            </motion.span>
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
