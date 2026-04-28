import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/index.js'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

export default function Layout({ children, hideNav = false, title = 'SIDELINE_PRO' }) {
  const points = useStore((s) => s.points)
  const toast = useStore((s) => s.toast)
  const showToast = useStore((s) => s.showToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => showToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast, showToast])

  return (
    <div className="mobile-frame text-on-background pb-28 font-body">
      <TopBar title={title} points={points} />
      <main className="relative">{children}</main>
      {!hideNav && <BottomNav />}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-primary-container text-background px-4 py-2 rounded-full font-label-caps text-label-caps shadow-[0_0_20px_rgba(216,207,188,0.5)] z-50 w-max max-w-[340px]"
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopBar({ title, points }) {
  const user = useStore((s) => s.user)
  return (
    <header className="sticky top-0 z-40 flex justify-between items-center px-4 h-14 bg-[#11120D] text-[#D8CFBC] border-b border-[#565449]">
      <Link to="/settings" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-container-highest" aria-label="Settings">
        <span className="material-symbols-outlined text-[20px]">settings</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="font-black text-base tracking-tighter">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-label-caps text-label-caps text-primary-container tabular-nums">{(points || 0).toLocaleString()} XP</span>
        <Link to="/profile" className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant overflow-hidden flex items-center justify-center">
          {user?.profile?.avatar_url
            ? <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="material-symbols-outlined text-sm text-outline">person</span>}
        </Link>
      </div>
    </header>
  )
}

const NAV = [
  { to: '/', icon: 'radar', label: 'PULSE' },
  { to: '/predict', icon: 'analytics', label: 'PREDICT' },
  { to: '/vault', icon: 'inventory_2', label: 'VAULT' },
  { to: '/leaderboard', icon: 'grid_view', label: 'BOARD' },
  { to: '/quiz', icon: 'psychology', label: 'IQ' }
]

function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex justify-around items-center h-16 px-2 bg-[#11120D]/85 backdrop-blur-xl border border-[#565449] rounded-full w-[90%] max-w-[360px] shadow-[inset_0_1px_2px_rgba(216,207,188,0.2),0_8px_24px_rgba(0,0,0,0.6)]">
      {NAV.map((n) => {
        const active = pathname === n.to || (n.to !== '/' && pathname.startsWith(n.to))
        return (
          <Link key={n.to} to={n.to}
            className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all ${active ? 'bg-[#D8CFBC] text-[#11120D] shadow-[0_0_15px_rgba(216,207,188,0.4)]' : 'text-[#565449] hover:text-[#D8CFBC]'}`}
            aria-label={n.label}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{n.icon}</span>
          </Link>
        )
      })}
    </nav>
  )
}
