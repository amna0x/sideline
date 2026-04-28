import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth.js'
import { useStore } from './store/index.js'

import Login from './screens/Login.jsx'
import Home from './screens/Home.jsx'
import Predict from './screens/Predict.jsx'
import Vault from './screens/Vault.jsx'
import Leaderboard from './screens/Leaderboard.jsx'
import Profile from './screens/Profile.jsx'
import Quiz from './screens/Quiz.jsx'
import Settings from './screens/Settings.jsx'
import AdidasDropOverlay from './screens/AdidasDrop.jsx'

export default function App() {
  useAuth()
  const session = useStore((s) => s.session)
  const location = useLocation()

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected session={session}><Home /></Protected>} />
            <Route path="/predict" element={<Protected session={session}><Predict /></Protected>} />
            <Route path="/vault" element={<Protected session={session}><Vault /></Protected>} />
            <Route path="/leaderboard" element={<Protected session={session}><Leaderboard /></Protected>} />
            <Route path="/profile" element={<Protected session={session}><Profile /></Protected>} />
            <Route path="/quiz" element={<Protected session={session}><Quiz /></Protected>} />
            <Route path="/settings" element={<Protected session={session}><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <AdidasDropOverlay />
    </>
  )
}

function Protected({ session, children }) {
  // allow access without supabase configured (demo mode)
  if (session === undefined) return null
  if (session === null && import.meta.env.VITE_SUPABASE_URL) return <Navigate to="/login" replace />
  return children
}
