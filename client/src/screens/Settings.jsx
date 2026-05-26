import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import { useStore } from '../store/index.js'
import { useAuth } from '../hooks/useAuth.js'
import { api } from '../lib/api.js'
import { cognitoReady, changePassword as cogChangePassword, deleteCurrentUser as cogDeleteUser } from '../lib/cognito.js'
import { THEMES, saveThemeToProfile } from '../lib/theme.js'
import { getSocket } from '../lib/socket.js'
import { requireSignedIn } from '../lib/guestGuard.js'
import { isAdminUser } from '../lib/admin.js'
import SFX from '../lib/sfx.js'

export default function Settings() {
  const user = useStore((s) => s.user)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const showToast = useStore((s) => s.showToast)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const sfxVolume = useStore((s) => s.sfxVolume)
  const setSfxVolume = useStore((s) => s.setSfxVolume)
  const { signOut } = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const profile = user?.profile || {}
  const [tab, setTab] = useState(searchParams.get('tab') || 'account')
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(profile.username || '')
  const [notif, setNotif] = useState(profile.notifications_enabled ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const isAdmin = isAdminUser(user)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'signout') { setConfirmSignOut(true); return }
    if (t) setTab(t)
  }, [searchParams])

  useEffect(() => setName(profile.username || ''), [profile.username])

  async function saveName() {
    if (!requireSignedIn('username editing')) return
    if (!user?.id || !name.trim()) return
    try {
      await api.updateUser(user.id, { username: name.trim() })
      setUserProfile({ ...profile, username: name.trim() })
      setEditingName(false); showToast('Username updated')
    } catch (e) {
      if (e.message?.includes('username_taken') || e.message?.includes('409')) {
        showToast('Username already taken')
      } else {
        showToast('Could not update username')
      }
    }
  }

  async function changePassword() {
    if (!requireSignedIn('password change')) return
    if (!cognitoReady) { showToast('Auth not configured'); return }
    const oldPw = window.prompt('Current password:')
    if (!oldPw) return
    const pw = window.prompt('New password (min 8 chars):')
    if (!pw || pw.length < 8) { showToast('Password must be at least 8 characters'); return }
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

  async function handleSignOut() {
    await signOut()
    nav('/login', { replace: true })
  }

  const TABS = [
    { key: 'account', label: 'Account', icon: 'person' },
    { key: 'themes', label: 'Themes', icon: 'palette' },
    { key: 'cosmetics', label: 'My Cosmetics', icon: 'auto_awesome' },
    { key: 'notifications', label: 'Push Alerts', icon: 'notifications' },
    ...(isAdmin ? [{ key: 'admin', label: 'Admin', icon: 'admin_panel_settings' }] : [])
  ]

  return (
    <Layout title="SETTINGS">
      <section className="px-4 pt-4 pb-8">
        <h1 className="font-comic text-2xl text-[#1a1a1a] mb-4">Settings</h1>

        {/* Tab navigation */}
        <div className="flex flex-col gap-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                tab === t.key
                  ? 'bg-[var(--sv-accent)]/10 text-[var(--sv-accent)] font-medium'
                  : 'text-[#666] hover:bg-black/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
              <span className="text-sm">{t.label}</span>
            </button>
          ))}

          {/* Sign out button */}
          <button
            onClick={() => setConfirmSignOut(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 transition-all mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>

        {/* Tab content */}
        {tab === 'account' && (
          <div className="space-y-3">
            <Card>
              <Row icon="badge" title="Username" sub={editingName ? null : (profile.username || 'Set name')}>
                {editingName ? (
                  <div className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} className="border border-[#e0e0e0] rounded-lg px-2 py-1 text-sm w-28 text-[#1a1a1a] focus:border-[var(--sv-accent)] focus:outline-none" />
                    <button onClick={saveName} className="text-[var(--sv-accent)] text-sm font-comic">SAVE</button>
                  </div>
                ) : <button onClick={() => setEditingName(true)} className="text-[var(--sv-accent)] text-sm font-comic">EDIT</button>}
              </Row>
              <Row icon="mail" title="Email" sub={user?.email || profile.email || 'Not set'} />
              <Row icon="shield_lock" title="Password" sub="Change password">
                <button onClick={changePassword} className="text-[var(--sv-accent)] text-sm font-comic">CHANGE</button>
              </Row>
            </Card>

            <Card tone="danger">
              <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                <span className="text-sm font-medium">Delete Account</span>
              </button>
            </Card>
          </div>
        )}

        {tab === 'themes' && (
          <div className="grid grid-cols-2 gap-3">
            {Object.values(THEMES).map((t) => {
              const active = theme === t.id
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTheme(t.id); saveThemeToProfile(user?.id, t.id, api) }}
                  className={`text-left rounded-xl border-2 p-3 transition-all bg-white ${active ? 'border-[var(--sv-accent)] shadow-[0_2px_12px_rgba(223,91,48,0.2)]' : 'border-[#e0e0e0] hover:border-[#ccc]'}`}
                >
                  <div className="flex gap-1.5 mb-2">
                    {t.swatches.map((c) => (
                      <span key={c} className="w-6 h-6 rounded-full border border-[#e0e0e0]" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="text-sm text-[#1a1a1a] font-medium">{t.name}</div>
                  <div className="text-[10px] text-[#999] font-comic">{active ? 'ACTIVE' : 'TAP TO APPLY'}</div>
                </motion.button>
              )
            })}
          </div>
        )}

        {tab === 'notifications' && (
          <Card>
            <Row icon="notifications_active" title="Push Alerts" sub="Goals, predictions, XP">
              <Toggle on={notif} onClick={toggleNotif} />
            </Row>
            <div className="p-4 border-b border-[#f0f0f0] last:border-b-0">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-[#999] text-[20px]">volume_up</span>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm text-[#1a1a1a] font-medium">Chat Sounds</span>
                    <span className="text-xs text-[#999] truncate">Send, reactions, direct replies</span>
                  </div>
                </div>
                <button onClick={() => SFX.play('send')} className="text-[var(--sv-accent)] text-sm font-comic">TEST</button>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#bbb] text-[18px]">volume_down</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(sfxVolume * 100)}
                  onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
                  onPointerUp={() => SFX.play('send')}
                  className="flex-1 accent-[var(--sv-accent)]"
                />
                <span className="w-9 text-right text-xs text-[#999]">{Math.round(sfxVolume * 100)}%</span>
              </div>
            </div>
          </Card>
        )}

        {tab === 'cosmetics' && <MyCosmeticsPanel userId={user?.id} />}

        {tab === 'admin' && isAdmin && <AdminPanel />}
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-[#e0e0e0] p-5 max-w-xs w-full shadow-lg"
          >
            <h3 className="font-comic text-xl text-red-500 mb-2">Delete Account?</h3>
            <p className="text-sm text-[#666] mb-4">This will permanently delete all your data.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border border-[#e0e0e0] rounded-xl font-comic text-sm text-[#666]">CANCEL</button>
              <button onClick={deleteAccount} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-comic text-sm">DELETE</button>
            </div>
          </motion.div>
        </div>
      )}

      {confirmSignOut && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-[#e0e0e0] p-5 max-w-xs w-full shadow-lg"
          >
            <h3 className="font-comic text-xl text-[#1a1a1a] mb-2">Sign Out?</h3>
            <p className="text-sm text-[#666] mb-4">You'll need to log in again to access your account.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSignOut(false)} className="flex-1 py-2.5 border border-[#e0e0e0] rounded-xl font-comic text-sm text-[#666]">CANCEL</button>
              <button onClick={handleSignOut} className="flex-1 py-2.5 bg-[var(--sv-accent)] text-white rounded-xl font-comic text-sm">SIGN OUT</button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  )
}

function AdminPanel() {
  const pushNotification = useStore((s) => s.pushNotification)
  const addPoints = useStore((s) => s.addPoints)
  const match = useStore((s) => s.match)
  const setMatch = useStore((s) => s.setMatch)

  async function grantBigXP() {
    const user = useStore.getState().user
    if (!user?.id) return
    try {
      const r = await api.post('/api/dev/grant', { user_id: user.id, points: 25000 })
      useStore.getState().setPoints(r.points_total)
      pushNotification({ type: 'xp', title: '+25,000 XP', message: `Total ${r.points_total.toLocaleString()}`, points: 25000, icon: '🪙', duration: 4000 })
    } catch (e) {
      pushNotification({ type: 'goal', title: 'FAILED', message: e.message?.slice(0, 60) || 'Enable DEV_TOOLS=1', duration: 4000 })
    }
  }

  async function grantAllVault() {
    const user = useStore.getState().user
    if (!user?.id) return
    try {
      const r = await api.post('/api/dev/grant', { user_id: user.id, vault_all: true })
      pushNotification({ type: 'vault', title: 'VAULT UNLOCKED', message: `${r.granted_count} items granted`, icon: '🗝️', duration: 4000 })
    } catch (e) {
      pushNotification({ type: 'goal', title: 'FAILED', message: e.message?.slice(0, 60) || 'Enable DEV_TOOLS=1', duration: 4000 })
    }
  }

  async function startSimulator() {
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

  return (
    <div className="space-y-3">
      <Card>
        <div className="p-4">
          <h3 className="font-comic text-sm text-[var(--sv-accent)] mb-3">ADMIN TOOLS</h3>
          <div className="grid grid-cols-2 gap-2">
            <Btn label="🪙 +25K XP" onClick={grantBigXP} />
            <Btn label="🗝️ All Vault" onClick={grantAllVault} />
            <Btn label="🚀 Simulator" onClick={startSimulator} />
          </div>
        </div>
      </Card>
    </div>
  )
}

function Btn({ label, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="py-2.5 px-3 rounded-xl font-comic text-[12px] bg-[var(--sv-accent)] text-white"
    >{label}</motion.button>
  )
}

function Card({ children, tone }) {
  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${tone === 'danger' ? 'border-red-200' : 'border-[#e0e0e0]'}`}>
      {children}
    </div>
  )
}

function Row({ icon, title, sub, children }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#f0f0f0] last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-[#999] text-[20px]">{icon}</span>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm text-[#1a1a1a] font-medium truncate">{title}</span>
          {sub && <span className="text-xs text-[#999] truncate">{sub}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-[var(--sv-accent)]' : 'bg-[#e0e0e0]'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function MyCosmeticsPanel({ userId }) {
  const [cosmetics, setCosmetics] = useState([])
  const [loading, setLoading] = useState(true)
  const showToast = useStore((s) => s.showToast)
  const setUserProfile = useStore((s) => s.setUserProfile)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    api.userCosmetics(userId).then(setCosmetics).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  async function toggleEquip(cosmeticId, currentlyEquipped) {
    await api.equipCosmetic(cosmeticId, !currentlyEquipped).catch(() => {})
    setCosmetics((prev) => prev.map((c) => {
      // Unequip others of same type when equipping
      if (c.cosmetic_id === cosmeticId) return { ...c, equipped: !currentlyEquipped }
      if (!currentlyEquipped && c.type === prev.find((x) => x.cosmetic_id === cosmeticId)?.type) return { ...c, equipped: false }
      return c
    }))
    api.user(userId).then(setUserProfile).catch(() => {})
    showToast(!currentlyEquipped ? 'Equipped!' : 'Unequipped')
  }

  const grouped = cosmetics.reduce((acc, c) => {
    const type = c.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(c)
    return acc
  }, {})

  const typeLabels = {
    avatar_decoration: '🎨 Avatar Decorations',
    profile_effect: '✨ Profile Effects',
    avatar_gif_unlock: '🎬 Unlocks',
    sticker_pack: '🎯 Sticker Packs'
  }

  if (loading) return <div className="text-center py-8 text-sm text-[#999]">Loading…</div>
  if (cosmetics.length === 0) return (
    <div className="text-center py-12">
      <span className="material-symbols-outlined text-[48px] text-[#ddd] mb-3 block">shopping_bag</span>
      <p className="text-sm text-[#999]">No cosmetics yet</p>
      <p className="text-xs text-[#bbb] mt-1">Visit the Vault to purchase decorations and effects</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h3 className="font-comic text-xs text-[var(--sv-accent)] mb-2">{typeLabels[type] || type.toUpperCase()}</h3>
          <div className="space-y-2">
            {items.map((c) => (
              <div key={c.cosmetic_id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${c.equipped ? 'border-[var(--sv-accent)] bg-[var(--sv-accent)]/5' : 'border-[#e0e0e0] bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#1a1a1a] font-medium">{c.name}</div>
                  <div className="text-[10px] text-[#999]">{c.description}</div>
                  <span className={`inline-block mt-1 text-[9px] font-comic px-1.5 py-0.5 rounded ${c.tier === 'legendary' ? 'bg-yellow-100 text-yellow-700' : c.tier === 'epic' ? 'bg-purple-100 text-purple-700' : c.tier === 'rare' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {(c.tier || 'common').toUpperCase()}
                  </span>
                </div>
                {c.type !== 'avatar_gif_unlock' && c.type !== 'sticker_pack' && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleEquip(c.cosmetic_id, c.equipped)}
                    className={`px-3 py-1.5 rounded-lg font-comic text-xs ${c.equipped ? 'bg-[var(--sv-accent)] text-white' : 'border border-[#e0e0e0] text-[#666]'}`}
                  >
                    {c.equipped ? 'EQUIPPED' : 'EQUIP'}
                  </motion.button>
                )}
                {c.type === 'avatar_gif_unlock' && (
                  <span className="text-[10px] font-comic text-green-600 bg-green-50 px-2 py-1 rounded-lg">ACTIVE</span>
                )}
                {c.type === 'sticker_pack' && (
                  <span className="text-[10px] font-comic text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">UNLOCKED</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
