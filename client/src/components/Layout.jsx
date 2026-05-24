import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/index.js'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import Avatar from './Avatar.jsx'
import Notifications from './Notifications.jsx'

export default function Layout({ children, hideNav = false, title = 'SIDELINE' }) {
  const points = useStore((s) => s.points)
  const toast = useStore((s) => s.toast)
  const showToast = useStore((s) => s.showToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => showToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast, showToast])

  return (
    <div className="mobile-frame text-on-background pb-28 font-body halftone relative">
      <TopBar title={title} points={points} />
      <Notifications />
      <main className="relative z-10">{children}</main>
      {!hideNav && <BottomNav />}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: "-40%", x: "-50%", opacity: 0, scale: 0.9 }}
            animate={{ y: "-50%", x: "-50%", opacity: 1, scale: 1 }}
            exit={{ y: "-40%", x: "-50%", opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 bg-[var(--sv-accent)] text-black px-6 py-3.5 rounded-2xl font-comic text-base shadow-[0_0_30px_rgba(255,59,107,0.3)] chromatic-box z-[100] w-[80%] max-w-[300px] text-center"
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopBar({ title, points }) {
  const user = useStore((s) => s.user)
  return (
    <header className="sticky top-0 z-40 flex justify-between items-center px-4 h-14 bg-black/95 backdrop-blur-md text-white border-b border-white/[0.06]">
      <Link to="/settings" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 transition-transform hover:scale-110 active:scale-95" aria-label="Settings">
        <span className="material-symbols-outlined text-[20px] text-white/60">settings</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="font-comic text-xl tracking-tight chromatic" data-text={title}>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <motion.span
          key={points}
          initial={{ scale: 1.3, color: 'var(--sv-accent)' }}
          animate={{ scale: 1, color: '' }}
          className="font-comic text-sm text-[var(--sv-accent)] tabular-nums"
        >{(points || 0).toLocaleString()} XP</motion.span>
        <Link to="/profile" className="rounded-full overflow-hidden border-2 border-[var(--sv-accent)]/40 hover:border-[var(--sv-accent)] transition-all hover:scale-110 active:scale-95 chromatic-box" aria-label="Profile">
          <Avatar url={user?.profile?.avatar_url} name={user?.profile?.username || user?.email} size={32} />
        </Link>
      </div>
    </header>
  )
}

const NAV = [
  { to: '/', icon: 'radar', label: 'PULSE' },
  { to: '/predict', icon: 'analytics', label: 'PREDICT' },
  { to: '/squad', icon: 'groups', label: 'SQUAD' },
  { to: '/vault', icon: 'inventory_2', label: 'VAULT' },
  { to: '/leaderboard', icon: 'grid_view', label: 'BOARD' }
]

function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex justify-around items-center h-16 px-2 bg-black/90 backdrop-blur-xl border border-white/[0.06] rounded-full w-[92%] max-w-[370px] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
      {NAV.map((n) => {
        const active = pathname === n.to || (n.to !== '/' && pathname.startsWith(n.to))
        return (
          <Link key={n.to} to={n.to}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all"
            aria-label={n.label}>
            <motion.div
              animate={active ? { scale: 1, y: -2 } : { scale: 0.9, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                active
                  ? 'bg-[var(--sv-accent)] text-black shadow-[0_0_12px_var(--sv-accent)]'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{n.icon}</span>
            </motion.div>
            {active && (
              <motion.span
                layoutId="nav-label"
                className="font-comic text-[9px] text-[var(--sv-accent)] mt-0.5"
              >{n.label}</motion.span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
