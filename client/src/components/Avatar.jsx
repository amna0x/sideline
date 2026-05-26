import { motion } from 'framer-motion'
import { useState } from 'react'
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

export default function Avatar({ url, name, size = 32, className = '', alt = '', showAdminAura = true, decorationId }) {
  const dim = { width: size, height: size }
  const fontSize = Math.max(10, Math.round(size * 0.42))
  const adminStyle = showAdminAura ? getAdminStyle(name) : null

  const [imgFailed, setImgFailed] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const inner = url && !imgFailed ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setImgFailed(true)}
      onLoad={() => setImgLoaded(true)}
      style={dim}
      className={`rounded-full object-cover bg-[#f0f0f0] ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity ${className}`}
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

  let decorationComponent = null
  if (decorationId) {
    switch (decorationId) {
      case 'deco_fire':
        decorationComponent = <FireDecoration size={size} />
        break
      case 'deco_lightning':
        decorationComponent = <LightningDecoration size={size} />
        break
      case 'deco_crown':
        decorationComponent = <CrownDecoration size={size} />
        break
      case 'deco_stars':
        decorationComponent = <StarsDecoration size={size} />
        break
      case 'deco_neon':
        decorationComponent = <NeonDecoration size={size} />
        break
      default:
        break
    }
  }

  const activeAura = decorationComponent ||
    (adminStyle?.auraType === 'sparkle' ? <SparkleAura size={size} /> : null) ||
    (adminStyle?.auraType === 'clouds' ? <CloudAura size={size} /> : null)

  if (!activeAura) return inner

  // Aura uses absolute positioning so it doesn't change the layout size of the avatar
  return (
    <span className="relative inline-block" style={dim}>
      {activeAura}
      <span className="relative z-10 block rounded-full" style={dim}>{inner}</span>
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

function FireDecoration({ size }) {
  return (
    <span className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      <motion.span
        className="absolute -inset-2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,80,0,0.4) 0%, rgba(255,160,0,0.1) 50%, transparent 70%)',
          filter: 'blur(4px)'
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[...Array(4)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-orange-500 text-xs"
          style={{
            left: `${15 + i * 20}%`,
            bottom: '-10%',
            filter: 'drop-shadow(0 0 4px rgba(255,80,0,0.8))'
          }}
          animate={{
            y: [0, -size * 0.7],
            x: [0, (i % 2 === 0 ? 8 : -8), 0],
            opacity: [0, 1, 0],
            scale: [0.6, 1, 0.4]
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut'
          }}
        >
          🔥
        </motion.span>
      ))}
    </span>
  )
}

function LightningDecoration({ size }) {
  return (
    <span className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      <motion.span
        className="absolute -inset-1.5 rounded-full border border-blue-400/50"
        style={{
          boxShadow: '0 0 12px rgba(90,168,255,0.6), inset 0 0 8px rgba(90,168,255,0.3)',
        }}
        animate={{
          opacity: [0.4, 0.9, 0.3, 0.8, 0.4],
          scale: [0.98, 1.04, 0.99, 1.02, 0.98]
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {[...Array(3)].map((_, i) => {
        const angles = [45, 180, 300]
        const angle = angles[i]
        const rad = (angle * Math.PI) / 180
        const x = `${50 + 45 * Math.cos(rad)}%`
        const y = `${50 + 45 * Math.sin(rad)}%`
        return (
          <motion.span
            key={i}
            className="absolute text-cyan-400 text-xs"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(0 0 3px rgba(0,246,172,0.8))'
            }}
            animate={{
              scale: [0, 1.3, 0],
              opacity: [0, 1, 0],
              rotate: [0, 15, -15, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.25,
              ease: 'easeInOut'
            }}
          >
            ⚡
          </motion.span>
        )
      })}
    </span>
  )
}

function CrownDecoration({ size }) {
  const crownSize = Math.max(16, size * 0.35)
  return (
    <span className="absolute inset-0 pointer-events-none z-20" aria-hidden>
      <motion.span
        className="absolute"
        style={{
          top: `-${crownSize * 0.85}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: `${crownSize}px`,
          filter: 'drop-shadow(0 2px 5px rgba(255,201,74,0.8))'
        }}
        animate={{
          y: [0, -3, 0],
          rotate: [-3, 3, -3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        👑
      </motion.span>
      <motion.span
        className="absolute text-[8px] text-[#ffc94a]"
        style={{ top: `-${crownSize * 0.9}px`, left: '30%' }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      >
        ✨
      </motion.span>
      <motion.span
        className="absolute text-[8px] text-[#ffc94a]"
        style={{ top: `-${crownSize * 0.6}px`, right: '25%' }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
      >
        ✦
      </motion.span>
    </span>
  )
}

function StarsDecoration({ size }) {
  const stars = [
    { x: '-12%', y: '-8%', delay: 0, s: 0.8 },
    { x: '92%', y: '-3%', delay: 0.4, s: 1 },
    { x: '102%', y: '62%', delay: 0.8, s: 0.7 },
    { x: '-12%', y: '72%', delay: 1.2, s: 0.9 },
    { x: '50%', y: '102%', delay: 0.6, s: 0.6 }
  ]

  return (
    <span className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      <motion.span
        className="absolute -inset-1.5 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,235,160,0.2) 0%, transparent 75%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {stars.map((star, i) => (
        <motion.span
          key={i}
          className="absolute text-[#ffd966]"
          style={{ left: star.x, top: star.y, fontSize: `${11 * star.s}px`, filter: 'drop-shadow(0 0 2px rgba(255,217,102,0.8))' }}
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.0, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
        >
          ⭐
        </motion.span>
      ))}
    </span>
  )
}

function NeonDecoration({ size }) {
  return (
    <span className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      <motion.span
        className="absolute -inset-1 rounded-full border-2 border-[#00f6ac]"
        style={{
          boxShadow: '0 0 10px #00f6ac, inset 0 0 5px #00f6ac',
        }}
        animate={{
          boxShadow: [
            '0 0 6px #00f6ac, inset 0 0 3px #00f6ac',
            '0 0 14px #00f6ac, inset 0 0 7px #00f6ac',
            '0 0 6px #00f6ac, inset 0 0 3px #00f6ac'
          ]
        }}
        transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
      />
    </span>
  )
}
