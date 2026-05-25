import { motion } from 'framer-motion'
import { initialsFor, colorsFor } from '../lib/avatar.js'
import { isAdmin } from '../lib/admin.js'

// Per-admin avatar decoration config
const ADMIN_STYLES = {
  amna: {
    // Cute sparkle/star aura — pink glowing stars floating around
    auraType: 'sparkle',
    colors: ['#FFE4F3', '#FF9ED8', '#C77DFF', '#7DF9FF'],
    glowColor: 'rgba(255,158,216,0.4)'
  },
  mohibkhan: {
    // Cloud/sky aura — soft clouds drifting around the avatar
    auraType: 'clouds',
    colors: ['#E8F4FD', '#B8D8E8', '#F0E6FF', '#FFE8D6'],
    glowColor: 'rgba(184,216,232,0.35)'
  }
}

function getAdminStyle(name) {
  if (!name) return null
  const key = name.toLowerCase().trim()
  return ADMIN_STYLES[key] || null
}

export default function Avatar({ url, name, size = 32, className = '', alt = '', showAdminAura = true }) {
  const dim = { width: size, height: size }
  const fontSize = Math.max(10, Math.round(size * 0.42))
  const adminStyle = showAdminAura ? getAdminStyle(name) : null

  const inner = url ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={dim}
      className={`rounded-full object-cover bg-[#f0f0f0] ${className}`}
    />
  ) : (
    <span
      style={{ ...dim, background: colorsFor(name).bg, color: colorsFor(name).fg, fontSize }}
      className={`rounded-full inline-flex items-center justify-center font-semibold tracking-tight select-none ${className}`}
      aria-label={alt || name}
    >
      {initialsFor(name)}
    </span>
  )

  if (!adminStyle) return inner

  if (adminStyle.auraType === 'sparkle') return <SparkleAura size={size}>{inner}</SparkleAura>
  if (adminStyle.auraType === 'clouds') return <CloudAura size={size}>{inner}</CloudAura>
  return inner
}

// Amna's aura — floating glowing stars
function SparkleAura({ size, children }) {
  const pad = Math.max(12, size * 0.2)
  const total = size + pad * 2
  const stars = [
    { x: '15%', y: '10%', delay: 0, s: 0.8 },
    { x: '75%', y: '5%', delay: 0.4, s: 1 },
    { x: '85%', y: '60%', delay: 0.8, s: 0.7 },
    { x: '10%', y: '70%', delay: 1.2, s: 0.9 },
    { x: '60%', y: '85%', delay: 0.6, s: 0.6 }
  ]

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: total, height: total }}>
      {/* Soft glow behind */}
      <motion.span
        className="absolute rounded-full"
        style={{ inset: pad / 2, background: 'radial-gradient(circle, rgba(255,158,216,0.2) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Floating stars */}
      {stars.map((star, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: star.x, top: star.y, fontSize: `${10 * star.s}px` }}
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
        >
          ✦
        </motion.span>
      ))}
      {/* Avatar */}
      <span className="relative z-10">{children}</span>
    </span>
  )
}

// Mohibkhan's aura — drifting clouds around the avatar
function CloudAura({ size, children }) {
  const pad = Math.max(14, size * 0.22)
  const total = size + pad * 2

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: total, height: total }}>
      {/* Soft sky glow */}
      <motion.span
        className="absolute rounded-full"
        style={{ inset: pad / 2, background: 'radial-gradient(circle, rgba(184,216,232,0.25) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Clouds */}
      <motion.span
        className="absolute text-[10px] opacity-80"
        style={{ left: '5%', top: '50%' }}
        animate={{ x: [0, 3, 0], y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >☁️</motion.span>
      <motion.span
        className="absolute text-[8px] opacity-70"
        style={{ right: '8%', top: '20%' }}
        animate={{ x: [0, -2, 0], y: [0, 2, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
      >☁️</motion.span>
      <motion.span
        className="absolute text-[9px] opacity-60"
        style={{ right: '15%', bottom: '15%' }}
        animate={{ x: [0, 2, 0], y: [0, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
      >☁️</motion.span>
      <motion.span
        className="absolute text-[7px] opacity-50"
        style={{ left: '20%', top: '10%' }}
        animate={{ x: [0, -1, 0], y: [0, 1, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
      >✨</motion.span>
      {/* Avatar */}
      <span className="relative z-10">{children}</span>
    </span>
  )
}

// Discord-inspired admin badge — dark rounded pill with sparkle icon
export function AdminBadge({ username, className = '' }) {
  if (!isAdmin(username)) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-comic bg-[#2b2d31] text-[#f0f0f0] border border-[#3a3c42] ${className}`}>
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10L4 13L5.5 8.5L2 5.5H6.5L8 1Z" fill="#4ade80" stroke="#22c55e" strokeWidth="0.5"/>
        <path d="M8 3L6 5.5H3.5L5.5 7.5L4.5 10L8 8L11.5 10L10.5 7.5L12.5 5.5H10L8 3Z" fill="#ef4444" stroke="#dc2626" strokeWidth="0.3" opacity="0.6"/>
      </svg>
      <span className="tracking-wide" style={{ textShadow: '0 0 4px rgba(255,255,255,0.1)' }}>ADMIN</span>
    </span>
  )
}
