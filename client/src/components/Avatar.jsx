import { motion } from 'framer-motion'
import { initialsFor, colorsFor } from '../lib/avatar.js'
import { isAdmin } from '../lib/admin.js'

// Per-admin avatar decoration config
const ADMIN_STYLES = {
  amna: { auraType: 'sparkle' },
  mohibkhan: { auraType: 'clouds' }
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

  // Aura uses absolute positioning so it doesn't change the layout size of the avatar
  return (
    <span className="relative inline-block" style={dim}>
      {adminStyle.auraType === 'sparkle' && <SparkleAura size={size} />}
      {adminStyle.auraType === 'clouds' && <CloudAura size={size} />}
      <span className="relative z-10 block" style={dim}>{inner}</span>
    </span>
  )
}

// Amna's aura — floating glowing stars (overflows outside avatar bounds via absolute positioning)
function SparkleAura({ size }) {
  const stars = [
    { x: '-15%', y: '-10%', delay: 0, s: 0.8 },
    { x: '95%', y: '-5%', delay: 0.4, s: 1 },
    { x: '105%', y: '60%', delay: 0.8, s: 0.7 },
    { x: '-15%', y: '70%', delay: 1.2, s: 0.9 },
    { x: '50%', y: '105%', delay: 0.6, s: 0.6 }
  ]

  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden>
      <motion.span
        className="absolute -inset-2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,158,216,0.25) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {stars.map((star, i) => (
        <motion.span
          key={i}
          className="absolute text-[#ff9ed8]"
          style={{ left: star.x, top: star.y, fontSize: `${10 * star.s}px` }}
          animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  )
}

// Mohibkhan's aura — drifting clouds (overflows outside avatar bounds via absolute positioning)
function CloudAura({ size }) {
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden>
      <motion.span
        className="absolute -inset-2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,216,232,0.3) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute text-[10px] opacity-90"
        style={{ left: '-20%', top: '40%' }}
        animate={{ x: [0, 3, 0], y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >☁️</motion.span>
      <motion.span
        className="absolute text-[8px] opacity-80"
        style={{ right: '-15%', top: '0%' }}
        animate={{ x: [0, -2, 0], y: [0, 2, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
      >☁️</motion.span>
      <motion.span
        className="absolute text-[9px] opacity-70"
        style={{ right: '-10%', bottom: '-5%' }}
        animate={{ x: [0, 2, 0], y: [0, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
      >☁️</motion.span>
      <motion.span
        className="absolute text-[7px] opacity-60"
        style={{ left: '5%', top: '-15%' }}
        animate={{ x: [0, -1, 0], y: [0, 1, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
      >✨</motion.span>
    </span>
  )
}

// Admin badge — orange gradient pill (matches app accent)
export function AdminBadge({ username, className = '' }) {
  if (!isAdmin(username)) return null
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-comic bg-gradient-to-r from-[#DF5B30] to-[#FF8C5A] text-white uppercase tracking-wider ${className}`}>
      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
      ADMIN
    </span>
  )
}
