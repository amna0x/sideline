import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/index.js'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
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
            className="fixed top-1/2 left-1/2 bg-[var(--sv-accent)] text-white px-6 py-3.5 rounded-2xl font-comic text-base shadow-[0_4px_24px_rgba(223,91,48,0.3)] z-[100] w-[80%] max-w-[300px] text-center"
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopBar({ title, points }) {
  const user = useStore((s) => s.user)
  const showToast = useStore((s) => s.showToast)
  const [profileMenu, setProfileMenu] = useState(false)
  const [settingsMenu, setSettingsMenu] = useState(false)
  const profileRef = useRef(null)
  const settingsRef = useRef(null)

  useEffect(() => {
    if (!profileMenu && !settingsMenu) return
    function close(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileMenu(false)
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [profileMenu, settingsMenu])

  function shareProfile() {
    const url = `${window.location.origin}/profile/${user?.id || ''}`
    if (navigator.share) {
      navigator.share({ title: 'My Sideline Profile', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Profile link copied!'))
    }
    setProfileMenu(false)
  }

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center px-4 h-14 bg-white/95 backdrop-blur-md text-[#1a1a1a] border-b border-black/[0.06]">
      {/* Settings dropdown (left) */}
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => { setSettingsMenu(!settingsMenu); setProfileMenu(false) }}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-transform hover:scale-110 active:scale-95"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[20px] text-[#666]">settings</span>
        </button>

        <AnimatePresence>
          {settingsMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 left-0 w-48 bg-white border border-[#e0e0e0] rounded-xl shadow-lg overflow-hidden z-50"
            >
              <Link to="/settings?tab=account" onClick={() => setSettingsMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#666]">person</span>
                Account
              </Link>
              <Link to="/settings?tab=themes" onClick={() => setSettingsMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">palette</span>
                Themes
              </Link>
              <Link to="/settings?tab=notifications" onClick={() => setSettingsMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">notifications</span>
                Push Alerts
              </Link>
              <Link to="/settings?tab=signout" onClick={() => setSettingsMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2">
        <span className="font-comic text-xl tracking-tight text-[#1a1a1a]">{title}</span>
      </div>

      {/* Profile dropdown (right) */}
      <div className="flex items-center gap-2 relative" ref={profileRef}>
        <motion.span
          key={points}
          initial={{ scale: 1.3, color: 'var(--sv-accent)' }}
          animate={{ scale: 1, color: '' }}
          className="font-comic text-sm text-[var(--sv-accent)] tabular-nums"
        >{(points || 0).toLocaleString()} XP</motion.span>
        <button
          onClick={() => { setProfileMenu(!profileMenu); setSettingsMenu(false) }}
          className="rounded-full overflow-hidden border-2 border-[var(--sv-accent)]/30 hover:border-[var(--sv-accent)] transition-all hover:scale-110 active:scale-95"
          aria-label="Profile menu"
        >
          <Avatar url={user?.profile?.avatar_url} name={user?.profile?.username || user?.email} size={32} />
        </button>

        <AnimatePresence>
          {profileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 right-0 w-44 bg-white border border-[#e0e0e0] rounded-xl shadow-lg overflow-hidden z-50"
            >
              <Link to="/profile" onClick={() => setProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#666]">person</span>
                View Profile
              </Link>
              <Link to="/profile?tab=friends" onClick={() => setProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">group_add</span>
                Friends
              </Link>
              <button onClick={shareProfile}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">share</span>
                Share Profile
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex justify-around items-center h-16 px-2 bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-full w-[92%] max-w-[370px] shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
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
                  ? 'bg-[var(--sv-accent)] text-white shadow-[0_2px_12px_rgba(223,91,48,0.3)]'
                  : 'text-[#999] hover:text-[#666]'
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
