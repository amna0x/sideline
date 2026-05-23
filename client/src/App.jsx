import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth.js'
import { useStore } from './store/index.js'
import { applyTheme, loadTheme } from './lib/theme.js'

import Login from './screens/Login.jsx'
import Home from './screens/Home.jsx'
import Predict from './screens/Predict.jsx'
import Vault from './screens/Vault.jsx'
import Leaderboard from './screens/Leaderboard.jsx'
import Profile from './screens/Profile.jsx'
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

  useEffect(() => {
    const initial = loadTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [setTheme])

  useEffect(() => { if (theme) applyTheme(theme) }, [theme])

  return (
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
          <Route path="/vault" element={<Protected session={session}><Vault /></Protected>} />
          <Route path="/leaderboard" element={<Protected session={session}><Leaderboard /></Protected>} />
          <Route path="/profile" element={<Protected session={session}><Profile /></Protected>} />
          <Route path="/quiz" element={<Protected session={session}><Quiz /></Protected>} />
          <Route path="/settings" element={<Protected session={session}><Settings /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
      <AdidasDropOverlay />
    </>
  )
}

function Protected({ session, children }) {
  if (session === undefined) return null
  if (session === null) return <Navigate to="/login" replace />
  return children
}
