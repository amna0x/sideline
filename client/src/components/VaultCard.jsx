import { motion } from 'framer-motion'

const TIER = {
  common:    { color: '#959086', label: 'COM', icon: 'radio_button_unchecked' },
  rare:      { color: '#A0C4FF', label: 'RAR', icon: 'verified' },
  epic:      { color: '#FFADAD', label: 'EPC', icon: 'diamond' },
  legendary: { color: '#FFD6A5', label: 'LGD', icon: 'stars' },
  mythic:    { color: '#FFFBF4', label: 'MYT', icon: 'auto_awesome' }
}

export default function VaultCard({ item, owned, points, onClick }) {
  const t = TIER[item.tier] || TIER.common
  const locked = !owned
  const insufficient = locked && points < (item.points_cost || 0)
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
            {locked ? 'lock' : t.icon}
          </span>
        </div>
        <div className="flex-grow flex items-center justify-center">
          {item.image_url
            ? <img src={item.image_url} alt={item.name} className={`w-20 h-20 object-contain ${locked ? 'grayscale opacity-40' : ''}`} />
            : <span className="material-symbols-outlined text-[40px]" style={{ color: locked ? '#565449' : t.color }}>{locked ? 'help_center' : 'sports_soccer'}</span>}
        </div>
        <div className="mt-auto">
          <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{locked ? '???' : item.name}</h3>
          <p className="font-label-caps text-[10px] text-outline mt-1">
            {locked
              ? insufficient ? `${item.points_cost} XP` : 'TAP TO REDEEM'
              : `OWNED · ${item.remaining_supply}/${item.total_supply}`}
          </p>
        </div>
      </div>
    </motion.button>
  )
}
