import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/index.js'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Avatar from './Avatar.jsx'
import Notifications from './Notifications.jsx'
import { api } from '../lib/api.js'
import { getSocket } from '../lib/socket.js'

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
      <main className="relative z-10 -mt-1">{children}</main>
      <AnimatePresence>
        {!hideNav && <BottomNavPortal />}
      </AnimatePresence>
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
  const [requestsPanel, setRequestsPanel] = useState(false)
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const profileRef = useRef(null)
  const settingsRef = useRef(null)
  const requestsRef = useRef(null)

  useEffect(() => {
    if (!profileMenu && !settingsMenu && !requestsPanel) return
    function close(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileMenu(false)
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsMenu(false)
      if (requestsRef.current && !requestsRef.current.contains(e.target)) setRequestsPanel(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [profileMenu, settingsMenu, requestsPanel])

  useEffect(() => {
    if (!user?.id) return
    api.friendRequests().then(setIncoming).catch(() => {})
    api.outgoingRequests().then(setOutgoing).catch(() => {})
    // Listen for real-time friend events
    let socket = null
    getSocket().then((s) => {
      socket = s
      s.on('friend:request_received', () => {
        api.friendRequests().then(setIncoming).catch(() => {})
      })
      s.on('friend:request_accepted', () => {
        api.outgoingRequests().then(setOutgoing).catch(() => {})
      })
    })
    return () => {
      if (socket) {
        socket.off('friend:request_received')
        socket.off('friend:request_accepted')
      }
    }
  }, [user?.id])

  function openRequests() {
    setProfileMenu(false)
    setRequestsPanel(true)
    api.friendRequests().then(setIncoming).catch(() => {})
    api.outgoingRequests().then(setOutgoing).catch(() => {})
  }

  async function accept(requestId) {
    await api.acceptFriend(requestId).catch(() => {})
    setIncoming((r) => r.filter((req) => req.request_id !== requestId))
    showToast('Friend added!')
  }

  async function decline(requestId) {
    await api.declineFriend(requestId).catch(() => {})
    setIncoming((r) => r.filter((req) => req.request_id !== requestId))
    setOutgoing((r) => r.filter((req) => req.request_id !== requestId))
  }

  function shareProfile() {
    const url = `${window.location.origin}/profile/${user?.id || ''}`
    if (navigator.share) {
      navigator.share({ title: 'My Sideline Profile', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Profile link copied!'))
    }
    setProfileMenu(false)
  }

  const requestCount = incoming.length

  return (
    <header className="app-topbar sticky top-3 z-40 mx-4 mt-3 mb-2 grid grid-cols-[1fr_auto_1fr] items-center px-4 h-16 text-white rounded-[28px] shadow-[0_14px_30px_var(--topbar-shadow)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <span className="material-symbols-outlined absolute -top-11 left-16 text-[118px] text-white/[0.10] animate-float rotate-[-18deg]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        <span className="material-symbols-outlined absolute -bottom-12 right-20 text-[94px] text-white/[0.065] animate-float rotate-[24deg] scale-x-125 scale-y-90" style={{ fontVariationSettings: "'FILL' 1", animationDelay: '0.8s' }}>star</span>
        <span className="material-symbols-outlined absolute -top-7 right-4 text-[58px] text-white/[0.055] rotate-[9deg]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        <span className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '18px 18px'
        }} />
      </div>
      {/* Settings dropdown (left) */}
      <div className="relative z-10 justify-self-start" ref={settingsRef}>
        <button
          onClick={() => { setSettingsMenu(!settingsMenu); setProfileMenu(false) }}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-transform hover:scale-110 active:scale-95"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[20px] text-white/80">settings</span>
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
              <button onClick={() => { setSettingsMenu(false); window.location.reload() }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">refresh</span>
                Reload App
              </button>
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
      <div className="relative z-10 flex items-center justify-center min-w-0 px-3 justify-self-center">
        <span className="font-comic text-[clamp(0.9rem,3.2vw,1.08rem)] tracking-[0.02em] text-[#e5cab2] truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.34)]">{title}</span>
      </div>

      {/* Profile dropdown (right) */}
      <div className="relative z-10 flex items-center gap-2 justify-self-end" ref={profileRef}>
        <motion.span
          key={points}
          initial={{ scale: 1.3, color: 'var(--sv-accent)' }}
          animate={{ scale: 1, color: '' }}
          className="font-comic text-sm text-[var(--topbar-accent)] tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
        >{(points || 0).toLocaleString()} XP</motion.span>
        <button
          onClick={() => { setProfileMenu(!profileMenu); setSettingsMenu(false); setRequestsPanel(false) }}
          className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--sv-accent)]/30 hover:border-[var(--sv-accent)] transition-all hover:scale-110 active:scale-95 relative"
          aria-label="Profile menu"
        >
          <Avatar url={user?.profile?.avatar_url} name={user?.profile?.username || user?.email} size={32} showAdminAura={false} />
          {requestCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--sv-accent)] text-white text-[9px] font-comic rounded-full flex items-center justify-center">{requestCount}</span>
          )}
        </button>

        <AnimatePresence>
          {profileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 right-0 w-48 bg-white border border-[#e0e0e0] rounded-lg shadow-lg overflow-hidden z-50"
            >
              <Link to="/profile" onClick={() => setProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#666]">person</span>
                View Profile
              </Link>
              <button onClick={openRequests}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">person_add</span>
                Friend Requests
                {requestCount > 0 && <span className="ml-auto bg-[var(--sv-accent)] text-white text-[10px] font-comic px-1.5 py-0.5 rounded-full">{requestCount}</span>}
              </button>
              <Link to="/profile?tab=friends" onClick={() => setProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[18px] text-[#666]">group</span>
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

        {/* Friend Requests Panel */}
        <AnimatePresence>
          {requestsPanel && (
            <motion.div
              ref={requestsRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 right-0 w-72 bg-white border border-[#e0e0e0] rounded-lg shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
            >
              <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
                <span className="font-comic text-sm text-[#1a1a1a]">Friend Requests</span>
                <button onClick={() => setRequestsPanel(false)} className="text-[#999] hover:text-[#1a1a1a]">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Incoming */}
              {incoming.length > 0 && (
                <div className="px-4 py-2">
                  <span className="font-comic text-[10px] text-[var(--sv-accent)] uppercase">Incoming</span>
                  <div className="mt-2 space-y-2">
                    {incoming.map((r) => (
                      <div key={r.request_id} className="flex items-center gap-2">
                        <Avatar url={r.avatar_url} name={r.username} size={32} />
                        <span className="text-sm text-[#1a1a1a] flex-1 truncate">{r.username}</span>
                        <button onClick={() => accept(r.request_id)} className="px-2 py-1 rounded-lg text-[10px] font-comic bg-[var(--sv-accent)] text-white">ACCEPT</button>
                        <button onClick={() => decline(r.request_id)} className="px-2 py-1 rounded-lg text-[10px] font-comic border border-[#e0e0e0] text-[#666]">DECLINE</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing */}
              {outgoing.length > 0 && (
                <div className="px-4 py-2 border-t border-[#f0f0f0]">
                  <span className="font-comic text-[10px] text-[#999] uppercase">Sent</span>
                  <div className="mt-2 space-y-2">
                    {outgoing.map((r) => (
                      <div key={r.request_id} className="flex items-center gap-2">
                        <Avatar url={r.avatar_url} name={r.username} size={32} />
                        <span className="text-sm text-[#1a1a1a] flex-1 truncate">{r.username}</span>
                        <span className="text-[10px] text-[#999] font-comic">PENDING</span>
                        <button onClick={() => decline(r.request_id)} className="px-2 py-1 rounded-lg text-[10px] font-comic border border-[#e0e0e0] text-[#666]">CANCEL</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {incoming.length === 0 && outgoing.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-[#bbb]">No pending requests</div>
              )}
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
    <motion.nav
      initial={{ x: '-50%', y: 96, opacity: 0, scale: 0.96 }}
      animate={{ x: '-50%', y: 0, opacity: 1, scale: 1 }}
      exit={{ x: '-50%', y: 96, opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="bottom-nav fixed left-1/2 z-50 flex justify-around items-center h-16 px-2 bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-full w-[92%] max-w-[420px] shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
    >
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
    </motion.nav>
  )
}

function BottomNavPortal() {
  if (typeof document === 'undefined') return null
  return createPortal(<BottomNav />, document.body)
}
