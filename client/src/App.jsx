import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth.js'
import { useStore } from './store/index.js'
import { applyTheme, loadTheme } from './lib/theme.js'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

import Login from './screens/Login.jsx'
import Home from './screens/Home.jsx'
import Predict from './screens/Predict.jsx'
import Vault from './screens/Vault.jsx'
import Leaderboard from './screens/Leaderboard.jsx'
import Profile from './screens/Profile.jsx'
import UserProfile from './screens/UserProfile.jsx'
import Quiz from './screens/Quiz.jsx'
import Settings from './screens/Settings.jsx'
import Squad from './screens/Squad.jsx'
import AdidasDropOverlay from './screens/AdidasDrop.jsx'

export default function App() {
  useAuth()
  const session = useStore((s) => s.session)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const initial = loadTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [setTheme])

  useEffect(() => { if (theme) applyTheme(theme) }, [theme])

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1400)
    return () => clearTimeout(t)
  }, [])

  return (
    <AppErrorBoundary resetKeys={[location.pathname, String(session !== null)]}>
      <>
        <motion.div
          key={location.pathname}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected session={session}><Home /></Protected>} />
            <Route path="/predict" element={<Protected session={session}><Predict /></Protected>} />
            <Route path="/squad" element={<Protected session={session}><Squad /></Protected>} />
            <Route path="/squad/join/:code" element={<Protected session={session}><Squad /></Protected>} />
            <Route path="/vault" element={<Protected session={session}><Vault /></Protected>} />
            <Route path="/leaderboard" element={<Protected session={session}><Leaderboard /></Protected>} />
            <Route path="/profile" element={<Protected session={session}><Profile /></Protected>} />
            <Route path="/profile/:userId" element={<Protected session={session}><UserProfile /></Protected>} />
            <Route path="/quiz" element={<Protected session={session}><Quiz /></Protected>} />
            <Route path="/settings" element={<Protected session={session}><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
        <AdidasDropOverlay />
        <AnimatePresence>
          {showSplash && <SplashScreen />}
        </AnimatePresence>
      </>
    </AppErrorBoundary>
  )
}

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ backgroundColor: 'var(--surface-bg, #f8f8f8)' }}
      className="fixed inset-y-0 left-1/2 z-[200] flex w-full max-w-full -translate-x-1/2 items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.1)] sm:max-w-[480px] lg:max-w-[420px]"
    >
      <motion.div
        initial={{ y: 16, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -10, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-[var(--sv-accent)] to-[var(--sv-purple)] text-white shadow-lg">
          <span className="material-symbols-outlined text-[56px] fill-icon">sports_soccer</span>
        </div>
        <h1 className="mt-5 font-comic text-3xl text-[#1a1a1a] tracking-tight">Sideline</h1>
        <div className="mt-3 h-1 w-20 rounded-full bg-[var(--sv-accent)]" />
      </motion.div>
    </motion.div>
  )
}

function Protected({ session, children }) {
  if (session === undefined) return null
  if (session === null) return <Navigate to="/login" replace />
  return children
}
