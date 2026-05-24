import { motion } from 'framer-motion'

// Per-item overrides — id-keyed icons keep every card visually distinct.
// Falls back to TYPE_ICON for unknown ids, then to the tier default.
const ITEM_ICON = {
  vi_frame_olive: 'shield',           // Olive Drab Frame — military insignia
  vi_badge_streak: 'local_fire_department', // 10-Win Streak — fire
  vi_card_brandt_md12: 'sports_soccer',     // Brandt 89' Winner — match-winning goal
  vi_card_adeyemi_md12: 'bolt',             // Adeyemi Strike — speed/strike
  vi_card_mythic_md12: 'emoji_events',      // Match-Winner Mythic — trophy
  vi_frame_floral: 'filter_vintage'         // Floral White Frame — petal motif
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
    label: 'COM',
    icon: 'shield',
    bg: 'radial-gradient(ellipse at center, #2c2a26 0%, #15140f 75%)',
    ring: '#959086'
  },
  rare: {
    color: '#A0C4FF',
    label: 'RAR',
    icon: 'verified',
    bg: 'radial-gradient(ellipse at center, #1f3a5c 0%, #0a1424 80%)',
    ring: '#A0C4FF'
  },
  epic: {
    color: '#FFADAD',
    label: 'EPC',
    icon: 'diamond',
    bg: 'radial-gradient(ellipse at center, #4a1d34 0%, #1a0a14 80%)',
    ring: '#FFADAD'
  },
  legendary: {
    color: '#FFD6A5',
    label: 'LGD',
    icon: 'workspace_premium',
    bg: 'radial-gradient(ellipse at center, #4a3416 0%, #1a1408 80%)',
    ring: '#FFD6A5'
  },
  mythic: {
    color: '#FFFBF4',
    label: 'MYT',
    icon: 'auto_awesome',
    bg: 'radial-gradient(ellipse at center, #2a1538 0%, #08040c 85%)',
    ring: '#FFFBF4'
  }
}

export default function VaultCard({ item, owned, points, onClick }) {
  const t = TIER[item.tier] || TIER.common
  const locked = !owned
  const insufficient = locked && points < (item.points_cost || 0)
  const itemIcon = pickIcon(item, t.icon)
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative group text-left"
    >
      {!locked && (
        <div className="absolute inset-0 rounded-2xl blur-xl opacity-30" style={{ backgroundColor: t.color }} />
      )}
      <div
        className={`relative z-10 rounded-2xl p-3 aspect-[3/4] flex flex-col border ${locked ? 'border-surface-container-highest bg-surface-container-lowest opacity-70' : 'bg-surface-container-low'}`}
        style={!locked ? { borderColor: t.color, boxShadow: `0 0 15px ${t.color}33` } : undefined}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-label-caps text-label-caps px-2 py-1 rounded-sm" style={{ color: locked ? '#565449' : t.color, backgroundColor: locked ? 'transparent' : `${t.color}15` }}>{t.label}</span>
          <span className="material-symbols-outlined text-[18px]" style={{ color: locked ? '#565449' : t.color, fontVariationSettings: locked ? "'FILL' 0" : "'FILL' 1" }}>
            {locked ? 'lock' : itemIcon}
          </span>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <TierVisual tier={item.tier || 'common'} icon={itemIcon} locked={locked} />
        </div>
        <div className="mt-auto">
          <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{locked ? '???' : item.name}</h3>
          <p className="font-label-caps text-[10px] text-outline mt-1">
            {locked
              ? insufficient ? `${item.points_cost} XP` : 'TAP TO UNLOCK'
              : `OWNED · ${item.remaining_supply}/${item.total_supply}`}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

function TierVisual({ tier, icon, locked }) {
  const t = TIER[tier] || TIER.common
  const dim = locked ? 'grayscale(0.6) brightness(0.45)' : 'none'
  const sizeClass = tier === 'mythic' ? 'w-[64%] max-w-[96px]' : 'w-[80%] max-w-[120px]'
  const iconSize = tier === 'mythic' ? '32px' : '40px'

  return (
    <div
      className={`relative aspect-square ${sizeClass} rounded-xl overflow-hidden flex items-center justify-center`}
      style={{ background: t.bg, filter: dim }}
    >
      {/* tier-specific decorations */}
      {tier === 'mythic' && !locked && <MythicAura color={t.ring} />}
      {tier === 'legendary' && !locked && <LegendaryStars color={t.ring} />}
      {tier === 'epic' && !locked && <EpicShimmer color={t.ring} />}
      {tier === 'rare' && !locked && <RareRing color={t.ring} />}

      {/* inner ring */}
      <div
        className="absolute inset-2 rounded-full"
        style={{
          border: `1px solid ${t.ring}${locked ? '40' : '60'}`,
          boxShadow: locked ? 'none' : `inset 0 0 14px ${t.ring}30`
        }}
      />

      {/* central icon */}
      <motion.span
        className="material-symbols-outlined relative z-10"
        style={{
          color: locked ? '#565449' : t.color,
          fontSize: iconSize,
          fontVariationSettings: locked ? "'FILL' 0" : "'FILL' 1",
          textShadow: locked ? 'none' : `0 0 14px ${t.ring}aa, 0 0 3px ${t.ring}`
        }}
        animate={!locked && (tier === 'legendary' || tier === 'mythic')
          ? { scale: [1, 1.06, 1] }
          : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
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
        background: `conic-gradient(from 0deg, transparent 0deg, ${color}55 60deg, transparent 120deg, transparent 240deg, ${color}33 300deg, transparent 360deg)`
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
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${color}66 30deg, transparent 90deg, transparent 180deg, ${color}44 210deg, transparent 270deg)`
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${color}33 0%, transparent 25%), radial-gradient(circle at 75% 75%, ${color}22 0%, transparent 25%)`
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
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          background: `conic-gradient(from 0deg, ${color}66, transparent 30%, ${color}33 50%, transparent 70%, ${color}55 100%)`,
          opacity: 0.55
        }}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        const r = 38
        return (
          <motion.span
            key={i}
            className="material-symbols-outlined absolute"
            style={{
              color,
              fontSize: '11px',
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px)`,
              transform: 'translate(-50%, -50%)',
              fontVariationSettings: "'FILL' 1",
              filter: `drop-shadow(0 0 4px ${color})`
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
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
      {/* prismatic conic */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'conic-gradient(from 0deg, #FFD6A5, #FFADAD, #A0C4FF, #B5E48C, #FFD6A5)',
          opacity: 0.22,
          filter: 'blur(12px)'
        }}
      />
      {/* counter-rotating outline */}
      <motion.div
        className="absolute inset-3 rounded-full border"
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ borderColor: `${color}55`, borderStyle: 'dashed' }}
      />
      {/* sparkles */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: color,
              left: '50%',
              top: '50%',
              boxShadow: `0 0 8px ${color}`
            }}
            animate={{
              x: [0, Math.cos(angle) * 36, 0],
              y: [0, Math.sin(angle) * 36, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.4, 0.5]
            }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        )
      })}
    </>
  )
}
