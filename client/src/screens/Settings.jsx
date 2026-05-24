import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import { useStore } from '../store/index.js'
import { useAuth } from '../hooks/useAuth.js'
import { api } from '../lib/api.js'
import { cognitoReady, changePassword as cogChangePassword, deleteCurrentUser as cogDeleteUser } from '../lib/cognito.js'
import { THEMES } from '../lib/theme.js'
import { getSocket } from '../lib/socket.js'

export default function Settings() {
  const user = useStore((s) => s.user)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const showToast = useStore((s) => s.showToast)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const { signOut } = useAuth()
  const nav = useNavigate()
  const profile = user?.profile || {}
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(profile.username || '')
  const [notif, setNotif] = useState(profile.notifications_enabled ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [devOpen, setDevOpen] = useState(false)

  useEffect(() => setName(profile.username || ''), [profile.username])

  async function saveName() {
    if (!user?.id || !name.trim()) return
    await api.updateUser(user.id, { username: name.trim() })
    setUserProfile({ ...profile, username: name.trim() })
    setEditingName(false); showToast('Username updated')
  }

  async function changePassword() {
    if (!cognitoReady) { showToast('Auth not configured'); return }
    const oldPw = window.prompt('Current password:')
    if (!oldPw) return
    const pw = window.prompt('New password (min 8 chars, with number + symbol):')
    if (!pw || pw.length < 8) return
    try {
      await cogChangePassword(oldPw, pw)
      showToast('Password updated')
    } catch (err) {
      showToast(err.message || 'Password change failed')
    }
  }

  async function toggleNotif() {
    const next = !notif
    if (next && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { showToast('Permission denied'); return }
    }
    setNotif(next)
    if (user?.id) await api.updateUser(user.id, { notifications_enabled: next })
  }

  async function deleteAccount() {
    if (!user?.id) return
    try {
      await api.delete(`/api/users/${user.id}`)
      if (cognitoReady) await cogDeleteUser().catch(() => {})
    } finally {
      await signOut()
      nav('/login', { replace: true })
    }
  }

  return (
    <Layout title="SETTINGS">
      <section className="px-4 pt-4 pb-8">
        <h1 className="font-comic text-3xl text-[var(--sv-accent)] chromatic mb-1" data-text="SETTINGS">SETTINGS</h1>
        <p className="text-sm text-white/40 mb-5">Configure your experience</p>

        <Group title="ACCOUNT">
          <Row icon="badge" title="Username" sub={editingName ? null : (profile.username || 'Set name')}>
            {editingName ? (
              <div className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className="bg-black border border-white/10 rounded-lg px-2 py-1 text-sm w-28 text-white focus:border-[var(--sv-accent)] focus:outline-none" />
                <button onClick={saveName} className="text-[var(--sv-accent)] text-sm font-comic">SAVE</button>
              </div>
            ) : <button onClick={() => setEditingName(true)} className="text-[var(--sv-accent)] text-sm font-comic">EDIT</button>}
          </Row>
          <Row icon="shield_lock" title="Password" sub="Change password">
            <button onClick={changePassword} className="text-[var(--sv-accent)] text-sm font-comic">CHANGE</button>
          </Row>
          <Row icon="verified" title="Tier" sub={`${(profile.tier || 'FAN').toUpperCase()}`} />
        </Group>

        <Group title="THEMES">
          <div className="p-4 grid grid-cols-2 gap-3">
            {Object.values(THEMES).map((t) => {
              const active = theme === t.id
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(t.id)}
                  className={`text-left rounded-xl border-2 p-3 transition-all ${active ? 'border-[var(--sv-accent)] shadow-[0_0_15px_var(--sv-accent)]' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="flex gap-1.5 mb-2">
                    {t.swatches.map((c) => (
                      <span key={c} className="w-6 h-6 rounded-full border border-white/10" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="text-sm text-white font-medium">{t.name}</div>
                  <div className="text-[10px] text-white/30 font-comic">{active ? 'ACTIVE' : 'TAP TO APPLY'}</div>
                </motion.button>
              )
            })}
          </div>
        </Group>

        <Group title="NOTIFICATIONS">
          <Row icon="notifications_active" title="Push Alerts" sub="Goals, drops, predictions">
            <Toggle on={notif} onClick={toggleNotif} />
          </Row>
        </Group>

        <Group title="ACTIONS" tone="error">
          <button onClick={signOut} className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">logout</span>
              <span className="text-red-400 font-medium">Sign Out</span>
            </div>
          </button>
          <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">delete_forever</span>
              <span className="text-red-400 font-medium">Delete Account</span>
            </div>
          </button>
        </Group>

        {/* DEV PANEL */}
        <div className="mt-6">
          <button
            onClick={() => setDevOpen(!devOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-[var(--sv-purple)]/40 hover:border-[var(--sv-purple)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--sv-purple)]">developer_mode</span>
              <span className="font-comic text-sm text-[var(--sv-purple)]">DEV PANEL</span>
            </div>
            <span className="material-symbols-outlined text-[var(--sv-purple)] text-sm">{devOpen ? 'expand_less' : 'expand_more'}</span>
          </button>

          {devOpen && <DevPanel />}
        </div>
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="comic-panel border-2 border-red-500/50 p-5 max-w-xs w-full"
          >
            <h3 className="font-comic text-xl text-red-400 mb-2">Delete Account?</h3>
            <p className="text-sm text-white/50 mb-4">All data permanently gone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-white/10 rounded-xl font-comic text-sm text-white/60">CANCEL</button>
              <button onClick={deleteAccount} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-comic text-sm">CONFIRM</button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  )
}

function DevPanel() {
  const pushNotification = useStore((s) => s.pushNotification)
  const addPoints = useStore((s) => s.addPoints)
  const pushEvent = useStore((s) => s.pushEvent)
  const setMatch = useStore((s) => s.setMatch)
  const addReaction = useStore((s) => s.addReaction)
  const setActiveDuel = useStore((s) => s.setActiveDuel)
  const setSquad = useStore((s) => s.setSquad)
  const setSquadMembers = useStore((s) => s.setSquadMembers)
  const match = useStore((s) => s.match)

  function triggerGoal() {
    const players = ['Musiala', 'Sané', 'Kane', 'Wirtz', 'Füllkrug', 'Adeyemi']
    const player = players[Math.floor(Math.random() * players.length)]
    const minute = Math.floor(Math.random() * 90) + 1
    const team = Math.random() > 0.5 ? 'home' : 'away'

    // Ensure a match exists
    let m = match
    if (!m) {
      m = { id: 'demo_match', home_team: 'Dortmund', away_team: 'Bayern', home_score: 0, away_score: 0, minute: 0, status: 'live', stadium: 'Signal Iduna Park', matchday: 9 }
      setMatch(m)
    }

    pushEvent({ type: 'goal', player_name: player, minute, team, created_at: new Date().toISOString() })
    pushNotification({ type: 'goal', title: `GOAL! ${player}`, message: `${minute}' — ${team} scores!`, icon: '⚽', duration: 5000 })

    setMatch({
      ...m,
      home_score: m.home_score + (team === 'home' ? 1 : 0),
      away_score: m.away_score + (team === 'away' ? 1 : 0),
      minute
    })
  }

  function triggerPrediction() {
    pushNotification({ type: 'prediction', title: 'NEW PREDICTION', message: 'Who scores next?', icon: '🎯', duration: 4000 })
  }

  function triggerXP() {
    const pts = [50, 100, 150, 200][Math.floor(Math.random() * 4)]
    addPoints(pts)
    pushNotification({ type: 'xp', title: 'XP EARNED', message: 'Prediction correct!', points: pts, icon: '⚡', duration: 3500 })
  }

  function triggerVaultDrop() {
    pushNotification({ type: 'vault', title: 'MYTHIC DROP', message: 'Legendary card unlocked!', icon: '💎', duration: 6000 })
  }

  function triggerDuelChallenge() {
    setActiveDuel({ duelId: 'dev-duel-1', challengerId: 'dev-user', challengerName: 'Rival_X', predictionId: 'p1', role: 'opponent', status: 'pending' })
    pushNotification({ type: 'duel', title: 'DUEL CHALLENGE', message: 'Rival_X wants to battle!', icon: '⚔️', duration: 5000 })
  }

  function triggerDuelResult() {
    const results = ['challenger_wins', 'opponent_wins', 'draw']
    const result = results[Math.floor(Math.random() * results.length)]
    setActiveDuel({ duelId: 'dev-duel-1', result, correctAnswer: 'Kane', challengerPick: 'Kane', opponentPick: 'Musiala', role: 'opponent', status: 'resolved' })
    pushNotification({ type: 'duel', title: result === 'opponent_wins' ? 'DUEL WON!' : result === 'draw' ? 'DUEL DRAW' : 'DUEL LOST', message: 'Result is in', icon: result === 'opponent_wins' ? '🏆' : '⚔️', duration: 4000 })
  }

  function triggerReactionBurst() {
    const emojis = ['⚽', '🔥', '😱', '👏', '💀']
    const names = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley']
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        addReaction({ emoji: emojis[Math.floor(Math.random() * emojis.length)], username: names[Math.floor(Math.random() * names.length)], ts: Date.now() })
      }, i * 200)
    }
  }

  function triggerSquadJoin() {
    const fakeMembers = [
      { userId: 'dev-1', username: 'NeonRider', avatar_url: null, joinedAt: Date.now() },
      { userId: 'dev-2', username: 'PixelKing', avatar_url: null, joinedAt: Date.now() },
      { userId: 'dev-3', username: 'GlitchFox', avatar_url: null, joinedAt: Date.now() },
      { userId: useStore.getState().user?.id || 'me', username: 'YOU', avatar_url: null, joinedAt: Date.now() }
    ]
    setSquad({ id: 'dev-squad', name: 'DEMO SQUAD', matchId: match?.id || 'demo', members: fakeMembers, memberCount: 4 })
    setSquadMembers(fakeMembers)
    pushNotification({ type: 'squad', title: 'SQUAD JOINED', message: '4 members watching', icon: '👥', duration: 3000 })
  }

  function triggerAllNotifs() {
    triggerGoal()
    setTimeout(triggerPrediction, 800)
    setTimeout(triggerXP, 1600)
    setTimeout(triggerVaultDrop, 2400)
    setTimeout(triggerDuelChallenge, 3200)
  }

  async function startSimulator() {
    // Create a local match if none exists
    if (!match) {
      setMatch({ id: 'bvb_fcb_2024_md9', home_team: 'Dortmund', away_team: 'Bayern', home_score: 0, away_score: 0, minute: 1, status: 'live', stadium: 'Signal Iduna Park', matchday: 9 })
    }
    try {
      const s = await getSocket()
      s.emit('match:join', match?.id || 'bvb_fcb_2024_md9')
      pushNotification({ type: 'prediction', title: 'SIMULATOR', message: 'Connected — events incoming', icon: '🚀', duration: 3000 })
    } catch (e) {
      pushNotification({ type: 'goal', title: 'ERROR', message: e.message, duration: 3000 })
    }
  }

  const buttons = [
    { label: '⚽ GOAL', fn: triggerGoal, bg: '#ff2d7b' },
    { label: '🎯 PREDICT', fn: triggerPrediction, bg: '#00f0ff' },
    { label: '⚡ +XP', fn: triggerXP, bg: '#39ff14' },
    { label: '💎 DROP', fn: triggerVaultDrop, bg: '#ffe14d' },
    { label: '⚔️ DUEL IN', fn: triggerDuelChallenge, bg: '#b44dff' },
    { label: '🏆 RESULT', fn: triggerDuelResult, bg: '#b44dff' },
    { label: '🎉 REACT', fn: triggerReactionBurst, bg: '#ff2d7b' },
    { label: '👥 SQUAD', fn: triggerSquadJoin, bg: '#00f0ff' },
    { label: '🚀 SIMULATE', fn: startSimulator, bg: '#39ff14' },
    { label: '💥 ALL', fn: triggerAllNotifs, bg: '#ffe14d' }
  ]

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="mt-3 overflow-hidden"
    >
      <div className="rounded-xl border-2 border-dashed border-[var(--sv-purple)]/30 p-4 bg-white/[0.01]">
        <p className="text-[10px] text-white/25 font-comic mb-3 uppercase tracking-wider">Demo triggers — tap to fire</p>
        <div className="grid grid-cols-2 gap-2">
          {buttons.map((b) => (
            <motion.button
              key={b.label}
              whileTap={{ scale: 0.88, skewX: -3 }}
              whileHover={{ scale: 1.03 }}
              onClick={b.fn}
              className="relative py-2.5 px-3 rounded-lg font-comic text-[13px] text-black uppercase tracking-tight overflow-hidden"
              style={{ background: b.bg }}
            >
              {/* Halftone on button */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{
                backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                backgroundSize: '4px 4px'
              }} />
              <span className="relative z-10 font-black">{b.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function Group({ title, tone, children }) {
  const borderColor = tone === 'error' ? 'border-red-500/20' : 'border-white/[0.06]'
  const titleColor = tone === 'error' ? 'text-red-400' : 'text-[var(--sv-accent)]'
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className={`font-comic text-xs ${titleColor}`}>{title}</h3>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <div className={`border ${borderColor} rounded-xl bg-white/[0.02] flex flex-col overflow-hidden`}>{children}</div>
    </section>
  )
}

function Row({ icon, title, sub, children }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-white/40">{icon}</span>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm text-white font-medium truncate">{title}</span>
          {sub && <span className="text-xs text-white/40 truncate">{sub}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-[var(--sv-accent)] shadow-[0_0_10px_var(--sv-accent)]' : 'bg-white/10 border border-white/10'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${on ? 'bg-black translate-x-6' : 'bg-white/40 translate-x-1'}`} />
    </button>
  )
}
