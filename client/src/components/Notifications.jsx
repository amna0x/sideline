import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../store/index.js'

export default function Notifications() {
  const notifications = useStore((s) => s.notifications)
  const removeNotification = useStore((s) => s.removeNotification)

  return (
    <div className="fixed top-16 left-0 right-0 z-[60] flex flex-col items-center gap-3 pointer-events-none px-3 max-w-[390px] mx-auto">
      <AnimatePresence mode="popLayout">
        {notifications.slice(0, 3).map((n, i) => (
          <NotifCard key={n.id} notif={n} index={i} onDismiss={() => removeNotification(n.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function NotifCard({ notif, index, onDismiss }) {
  const [progress, setProgress] = useState(100)
  const dismiss = useCallback(() => onDismiss(), [onDismiss])

  useEffect(() => {
    const duration = Math.min(notif.duration || 2000, 2000)
    const start = Date.now()
    const frame = () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) { dismiss(); return }
      raf = requestAnimationFrame(frame)
    }
    let raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [notif.duration, dismiss])

  const s = STYLES[notif.type] || STYLES.default

  return (
    <motion.div
      layout
      initial={{ y: -60, opacity: 0, scale: 0.7, skewX: -8 }}
      animate={{
        y: index * 4,
        opacity: 1,
        scale: 1 - index * 0.03,
        skewX: 0
      }}
      exit={{ x: 200, opacity: 0, scale: 0.6, skewX: 12 }}
      transition={{ type: 'spring', damping: 14, stiffness: 280, mass: 0.7 }}
      className="relative w-full pointer-events-auto cursor-pointer"
      onClick={dismiss}
    >
      {/* Main card — solid fill like Unbound UI panels */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ background: s.bg }}
      >
        {/* Halftone dot overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.12]" style={{
          backgroundImage: `radial-gradient(circle, ${s.dotColor} 1.5px, transparent 1.5px)`,
          backgroundSize: '5px 5px'
        }} />

        {/* Diagonal slash lines — Unbound graffiti texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 6px, ${s.slashColor} 6px, ${s.slashColor} 7px)`
        }} />

        {/* Spray paint edge — top */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: s.edgeColor, boxShadow: `0 0 8px ${s.edgeColor}` }}
        />

        {/* Content row */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-3">
          {/* Icon — bold, no container, just raw */}
          <span className="text-2xl shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{notif.icon || s.icon}</span>

          {/* Text — thick, black on neon OR white on dark */}
          <div className="flex-1 min-w-0">
            <div
              className="font-comic text-[14px] leading-tight truncate uppercase"
              style={{ color: s.textColor, textShadow: s.textShadow || 'none' }}
            >{notif.title}</div>
            {notif.message && (
              <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: s.subColor }}>{notif.message}</div>
            )}
          </div>

          {/* Points — chunky badge */}
          {notif.points && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.1, damping: 10 }}
              className="shrink-0 font-comic text-[15px] px-2.5 py-1 rounded-md"
              style={{ background: s.badgeBg, color: s.badgeText, boxShadow: `0 2px 8px ${s.badgeShadow}` }}
            >+{notif.points}</motion.div>
          )}
        </div>

        {/* Progress — bottom bar */}
        <div className="h-[3px] w-full" style={{ background: `${s.progressTrack}` }}>
          <div
            className="h-full rounded-full transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%`, background: s.progressFill }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// NFS Unbound style — solid fills, high contrast, street energy
const STYLES = {
  goal: {
    bg: '#ff2d7b',
    dotColor: '#000',
    slashColor: '#000',
    edgeColor: '#fff',
    textColor: '#000',
    textShadow: 'none',
    subColor: 'rgba(0,0,0,0.6)',
    badgeBg: '#000',
    badgeText: '#ff2d7b',
    badgeShadow: 'rgba(0,0,0,0.4)',
    progressTrack: 'rgba(0,0,0,0.2)',
    progressFill: '#000',
    icon: '⚽'
  },
  prediction: {
    bg: '#00f0ff',
    dotColor: '#000',
    slashColor: '#000',
    edgeColor: '#fff',
    textColor: '#000',
    textShadow: 'none',
    subColor: 'rgba(0,0,0,0.5)',
    badgeBg: '#000',
    badgeText: '#00f0ff',
    badgeShadow: 'rgba(0,0,0,0.4)',
    progressTrack: 'rgba(0,0,0,0.2)',
    progressFill: '#000',
    icon: '🎯'
  },
  xp: {
    bg: '#39ff14',
    dotColor: '#000',
    slashColor: '#000',
    edgeColor: '#fff',
    textColor: '#000',
    textShadow: 'none',
    subColor: 'rgba(0,0,0,0.5)',
    badgeBg: '#000',
    badgeText: '#39ff14',
    badgeShadow: 'rgba(0,0,0,0.4)',
    progressTrack: 'rgba(0,0,0,0.2)',
    progressFill: '#000',
    icon: '⚡'
  },
  duel: {
    bg: '#b44dff',
    dotColor: '#000',
    slashColor: '#000',
    edgeColor: '#fff',
    textColor: '#000',
    textShadow: 'none',
    subColor: 'rgba(0,0,0,0.5)',
    badgeBg: '#000',
    badgeText: '#b44dff',
    badgeShadow: 'rgba(0,0,0,0.4)',
    progressTrack: 'rgba(0,0,0,0.2)',
    progressFill: '#000',
    icon: '⚔️'
  },
  vault: {
    bg: '#ffe14d',
    dotColor: '#000',
    slashColor: '#000',
    edgeColor: '#fff',
    textColor: '#000',
    textShadow: 'none',
    subColor: 'rgba(0,0,0,0.5)',
    badgeBg: '#000',
    badgeText: '#ffe14d',
    badgeShadow: 'rgba(0,0,0,0.4)',
    progressTrack: 'rgba(0,0,0,0.2)',
    progressFill: '#000',
    icon: '💎'
  },
  squad: {
    bg: '#1a1a1a',
    dotColor: '#fff',
    slashColor: '#fff',
    edgeColor: 'var(--sv-accent)',
    textColor: '#fff',
    textShadow: '0 0 8px rgba(255,45,123,0.3)',
    subColor: 'rgba(255,255,255,0.4)',
    badgeBg: 'var(--sv-accent)',
    badgeText: '#000',
    badgeShadow: 'rgba(255,45,123,0.3)',
    progressTrack: 'rgba(255,255,255,0.05)',
    progressFill: 'var(--sv-accent)',
    icon: '👥'
  },
  default: {
    bg: '#ff2d7b',
    dotColor: '#000',
    slashColor: '#000',
    edgeColor: '#fff',
    textColor: '#000',
    textShadow: 'none',
    subColor: 'rgba(0,0,0,0.5)',
    badgeBg: '#000',
    badgeText: '#ff2d7b',
    badgeShadow: 'rgba(0,0,0,0.4)',
    progressTrack: 'rgba(0,0,0,0.2)',
    progressFill: '#000',
    icon: '📢'
  }
}
