import { motion } from 'framer-motion'

const ITEM_ICON = {
  vi_frame_olive: 'shield',
  vi_badge_streak: 'local_fire_department',
  vi_card_brandt_md12: 'sports_soccer',
  vi_card_adeyemi_md12: 'bolt',
  vi_card_mythic_md12: 'emoji_events',
  vi_frame_floral: 'filter_vintage',
  vi_badge_first_blood: 'whatshot',
  vi_card_kane_md12: 'sports_soccer',
  vi_badge_perfect_week: 'stars',
  vi_frame_neon: 'blur_on',
  vi_card_musiala_md12: 'electric_bolt',
  vi_badge_squad_mvp: 'groups'
}

const TYPE_ICON = {
  profile_frame: 'badge',
  badge: 'military_tech',
  adidas_card: 'sports_soccer',
  collectible: 'emoji_events'
}

function pickIcon(item, tierFallback) {
  if (!item) return tierFallback
  return ITEM_ICON[item.id] || TYPE_ICON[item.type] || tierFallback
}

const TIER = {
  common: {
    color: '#959086',
    label: 'COMMON',
    icon: 'shield',
    bg: 'radial-gradient(ellipse at center, #2c2a26 0%, #15140f 75%)',
    ring: '#959086',
    glow: 'none'
  },
  rare: {
    color: '#A0C4FF',
    label: 'RARE',
    icon: 'verified',
    bg: 'radial-gradient(ellipse at 30% 20%, #1f3a5c 0%, #0a1424 80%)',
    ring: '#A0C4FF',
    glow: '0 0 20px rgba(160,196,255,0.3)'
  },
  epic: {
    color: '#FF6B9D',
    label: 'EPIC',
    icon: 'diamond',
    bg: 'radial-gradient(ellipse at 40% 30%, #5c1a3a 0%, #1a0a14 70%)',
    ring: '#FF6B9D',
    glow: '0 0 30px rgba(255,107,157,0.4), 0 0 60px rgba(255,107,157,0.15)'
  },
  legendary: {
    color: '#FFB347',
    label: 'LEGENDARY',
    icon: 'workspace_premium',
    bg: 'radial-gradient(ellipse at 50% 30%, #5c3a16 0%, #1a1408 70%)',
    ring: '#FFB347',
    glow: '0 0 35px rgba(255,179,71,0.5), 0 0 70px rgba(255,179,71,0.2)'
  },
  mythic: {
    color: '#E8D5FF',
    label: 'MYTHIC',
    icon: 'auto_awesome',
    bg: 'radial-gradient(ellipse at 50% 40%, #2a1538 0%, #08040c 85%)',
    ring: '#E8D5FF',
    glow: '0 0 40px rgba(232,213,255,0.5), 0 0 80px rgba(232,213,255,0.2), 0 0 120px rgba(160,196,255,0.1)'
  }
}

export default function VaultCard({ item, owned, points, onClick }) {
  const t = TIER[item.tier] || TIER.common
  const locked = !owned
  const itemIcon = pickIcon(item, t.icon)

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="relative group text-left w-full"
    >
      {/* Glow effect for owned epic+ items */}
      {!locked && (item.tier === 'epic' || item.tier === 'legendary' || item.tier === 'mythic') && (
        <motion.div
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{ backgroundColor: t.color, opacity: 0.25 }}
          animate={{ opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div
        className={`relative z-10 rounded-2xl p-3 h-[200px] flex flex-col border transition-all ${
          locked
            ? 'border-[#e0e0e0] bg-[#f5f5f5] opacity-75'
            : 'bg-white'
        }`}
        style={!locked ? {
          borderColor: t.color,
          boxShadow: t.glow
        } : undefined}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-1">
          <span
            className="font-label-caps text-[9px] px-1.5 py-0.5 rounded-sm"
            style={{
              color: locked ? '#bbb' : t.color,
              backgroundColor: locked ? 'transparent' : `${t.color}18`
            }}
          >
            {t.label}
          </span>
          <span
            className="material-symbols-outlined text-[16px]"
            style={{
              color: locked ? '#bbb' : t.color,
              fontVariationSettings: locked ? "'FILL' 0" : "'FILL' 1"
            }}
          >
            {locked ? 'lock' : itemIcon}
          </span>
        </div>

        {/* Visual center */}
        <div className="flex-grow flex items-center justify-center">
          <TierVisual tier={item.tier || 'common'} icon={itemIcon} locked={locked} />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-1">
          <h3 className="font-body-md text-[12px] font-semibold text-on-surface truncate">
            {locked ? '???' : item.name}
          </h3>
          <p className="font-label-caps text-[9px] text-outline mt-0.5">
            {locked
              ? `${(item.points_cost || 0).toLocaleString()} XP`
              : `OWNED · ${item.remaining_supply}/${item.total_supply}`}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

function TierVisual({ tier, icon, locked }) {
  const t = TIER[tier] || TIER.common
  const dim = locked ? 'grayscale(0.6) brightness(0.4)' : 'none'

  return (
    <div
      className="relative w-[70px] h-[70px] rounded-xl overflow-hidden flex items-center justify-center"
      style={{ background: t.bg, filter: dim }}
    >
      {tier === 'mythic' && !locked && <MythicAura color={t.ring} />}
      {tier === 'legendary' && !locked && <LegendaryStars color={t.ring} />}
      {tier === 'epic' && !locked && <EpicShimmer color={t.ring} />}
      {tier === 'rare' && !locked && <RareRing color={t.ring} />}

      {/* Inner ring */}
      <div
        className="absolute inset-2 rounded-full"
        style={{
          border: `1px solid ${t.ring}${locked ? '30' : '50'}`,
          boxShadow: locked ? 'none' : `inset 0 0 12px ${t.ring}25`
        }}
      />

      {/* Central icon */}
      <motion.span
        className="material-symbols-outlined relative z-10"
        style={{
          color: locked ? '#bbb' : t.color,
          fontSize: '28px',
          fontVariationSettings: locked ? "'FILL' 0" : "'FILL' 1",
          textShadow: locked ? 'none' : `0 0 12px ${t.ring}aa, 0 0 3px ${t.ring}`
        }}
        animate={!locked && (tier === 'legendary' || tier === 'mythic')
          ? { scale: [1, 1.08, 1] }
          : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.span>
    </div>
  )
}

function RareRing({ color }) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      style={{
        background: `conic-gradient(from 0deg, transparent 0deg, ${color}44 60deg, transparent 120deg, transparent 240deg, ${color}22 300deg, transparent 360deg)`
      }}
    />
  )
}

function EpicShimmer({ color }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${color}77 20deg, transparent 60deg, ${color}55 180deg, transparent 220deg, ${color}44 300deg, transparent 340deg)`
        }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, ${color}44 0%, transparent 30%), radial-gradient(circle at 70% 70%, ${color}33 0%, transparent 30%)`
        }}
      />
    </>
  )
}

function LegendaryStars({ color }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{
          background: `conic-gradient(from 0deg, ${color}88, transparent 25%, ${color}55 50%, transparent 75%, ${color}77 100%)`,
          opacity: 0.5
        }}
      />
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        const r = 28
        return (
          <motion.span
            key={i}
            className="material-symbols-outlined absolute"
            style={{
              color,
              fontSize: '10px',
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px)`,
              transform: 'translate(-50%, -50%)',
              fontVariationSettings: "'FILL' 1",
              filter: `drop-shadow(0 0 4px ${color})`
            }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
          >
            star
          </motion.span>
        )
      })}
    </>
  )
}

function MythicAura({ color }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'conic-gradient(from 0deg, #FFB347, #FF6B9D, #A0C4FF, #B5E48C, #E8D5FF, #FFB347)',
          opacity: 0.2,
          filter: 'blur(8px)'
        }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border"
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{ borderColor: `${color}44`, borderStyle: 'dashed' }}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: color,
              left: '50%',
              top: '50%',
              boxShadow: `0 0 6px ${color}`
            }}
            animate={{
              x: [0, Math.cos(angle) * 28, 0],
              y: [0, Math.sin(angle) * 28, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        )
      })}
    </>
  )
}
