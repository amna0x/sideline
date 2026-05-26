import { motion } from 'framer-motion'

const ART = {
  trophy: {
    icon: 'emoji_events',
    accent: '#FFB347',
    glow: 'rgba(255,179,71,0.35)',
    bg: 'linear-gradient(135deg, #072b2f 0%, #0b6b68 100%)'
  },
  star: {
    icon: 'star',
    accent: '#FFD166',
    glow: 'rgba(255,209,102,0.35)',
    bg: 'linear-gradient(135deg, #211447 0%, #6544d8 100%)'
  },
  world: {
    icon: 'public',
    accent: '#6EE7F9',
    glow: 'rgba(110,231,249,0.35)',
    bg: 'linear-gradient(135deg, #0a2b55 0%, #0f8bb3 100%)'
  },
  cup: {
    icon: 'workspace_premium',
    accent: '#F9D371',
    glow: 'rgba(249,211,113,0.35)',
    bg: 'linear-gradient(135deg, #171717 0%, #784421 100%)'
  },
  squad: {
    icon: 'groups',
    accent: '#7DD3FC',
    glow: 'rgba(125,211,252,0.32)',
    bg: 'linear-gradient(135deg, #102a43 0%, #26547c 100%)'
  }
}

export default function HeaderArtCard({ variant = 'trophy', eyebrow, title, sub, className = '' }) {
  const art = ART[variant] || ART.trophy

  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 240 }}
      className={`relative overflow-hidden rounded-lg min-h-[118px] px-4 py-4 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ${className}`}
      style={{ background: art.bg }}
    >
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
        backgroundSize: '18px 18px'
      }} />
      <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-black/25" />
      <div className="absolute -left-10 -bottom-14 w-40 h-40 rounded-full bg-white/10" />
      <motion.div
        className="absolute right-3 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full flex items-center justify-center"
        style={{ background: `radial-gradient(circle, ${art.glow} 0%, rgba(255,255,255,0.08) 55%, transparent 70%)` }}
        animate={{ rotate: [0, 4, -3, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="material-symbols-outlined text-[78px]"
          style={{
            color: art.accent,
            fontVariationSettings: "'FILL' 1",
            textShadow: `0 8px 26px ${art.glow}, 0 2px 0 rgba(0,0,0,0.18)`
          }}
        >
          {art.icon}
        </span>
      </motion.div>
      <motion.span
        className="material-symbols-outlined absolute right-[104px] top-4 text-[22px] text-white/55"
        animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        star
      </motion.span>
      <motion.span
        className="material-symbols-outlined absolute right-10 bottom-4 text-[18px] text-white/45"
        animate={{ opacity: [0.25, 0.75, 0.25], y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        sports_soccer
      </motion.span>

      <div className="relative z-10 max-w-[62%]">
        {eyebrow && <div className="font-comic text-[10px] text-white/70 uppercase tracking-[0.08em] mb-1">{eyebrow}</div>}
        <h2 className="font-comic text-[22px] leading-[1.05] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">{title}</h2>
        {sub && <p className="mt-2 text-xs leading-snug text-white/76">{sub}</p>}
      </div>
    </motion.section>
  )
}
