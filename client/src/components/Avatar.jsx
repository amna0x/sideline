import { motion } from 'framer-motion'
import { initialsFor, colorsFor } from '../lib/avatar.js'
import { isAdmin } from '../lib/admin.js'

export default function Avatar({ url, name, size = 32, className = '', alt = '', showAdminAura = true }) {
  const dim = { width: size, height: size }
  const fontSize = Math.max(10, Math.round(size * 0.42))
  const admin = showAdminAura && isAdmin(name)
  const auraSize = size + 8

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

  if (!admin) return inner

  // Admin aura — animated prismatic ring
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: auraSize, height: auraSize }}>
      <motion.span
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'conic-gradient(from 0deg, #DF5B30, #FFB347, #DF2EC1, #5aa8ff, #00f6ac, #DF5B30)',
          padding: 2
        }}
      />
      <span className="absolute inset-[3px] rounded-full bg-white" />
      <span className="relative z-10">{inner}</span>
    </span>
  )
}

export function AdminBadge({ username, className = '' }) {
  if (!isAdmin(username)) return null
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-comic bg-gradient-to-r from-[#DF5B30] to-[#DF2EC1] text-white uppercase tracking-wider ${className}`}>
      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
      ADMIN
    </span>
  )
}
