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

export default function Settings() {
  const user = useStore((s) => s.user)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const showToast = useStore((s) => s.showToast)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
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
  const sfxEnabled = useStore((s) => s.sfxEnabled)
  const sfxVolume = useStore((s) => s.sfxVolume)
  const setSfxEnabled = useStore((s) => s.setSfxEnabled)
  const setSfxVolume = useStore((s) => s.setSfxVolume)

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
            <Row icon="volume_up" title="Sound Effects" sub="UI & chat feedback">
              <div className="flex items-center gap-2">
                <Toggle on={sfxEnabled} onClick={() => setSfxEnabled(!sfxEnabled)} />
                <input type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={(e) => setSfxVolume(Number(e.target.value))} className="w-28" />
              </div>
            </Row>
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
  const currentUser = useStore((s) => s.user)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [xpDelta, setXpDelta] = useState(25000)
  const [busy, setBusy] = useState(false)
  const [vaultBusy, setVaultBusy] = useState(false)
  const [matchBusy, setMatchBusy] = useState(false)
  const match = useStore((s) => s.match)
  const setMatch = useStore((s) => s.setMatch)

  useEffect(() => {
    let cancelled = false
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return () => {}
    }
    const t = setTimeout(async () => {
      try {
        const rows = await api.searchUsers(q).catch(() => [])
        if (!cancelled) setResults(rows || [])
      } catch {
        if (!cancelled) setResults([])
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  async function applyXp(deltaOverride) {
    const target = selectedUser || currentUser
    const delta = Number(deltaOverride ?? xpDelta)
    if (!target?.id || !Number.isFinite(delta) || delta === 0) {
      pushNotification({ type: 'goal', title: 'NO CHANGE', message: 'Pick a user and enter a non-zero XP amount', duration: 3000 })
      return
    }
    setBusy(true)
    try {
      const r = await api.post('/api/dev/grant', { user_id: target.id, points: delta })
      if (target.id === currentUser?.id) {
        useStore.getState().setPoints(r.points_total)
      }
      if (target.id === currentUser?.id) {
        api.user(target.id).then((p) => useStore.getState().setUserProfile(p)).catch(() => {})
      }
      setSelectedUser((cur) => cur ? { ...cur, points_total: r.points_total } : cur)
      pushNotification({
        type: 'xp',
        title: delta > 0 ? `+${delta.toLocaleString()} XP` : `${delta.toLocaleString()} XP`,
        message: `${target.username || target.email || target.id} → ${r.points_total.toLocaleString()} XP`,
        points: delta,
        icon: '🪙',
        duration: 4000
      })
    } catch (e) {
      pushNotification({ type: 'goal', title: 'FAILED', message: e.message?.slice(0, 70) || 'Enable DEV_TOOLS=1', duration: 4000 })
    } finally {
      setBusy(false)
    }
  }

  async function grantAllVault() {
    const target = selectedUser || currentUser
    if (!target?.id) return
    setVaultBusy(true)
    try {
      const r = await api.post('/api/dev/grant', { user_id: target.id, vault_all: true })
      pushNotification({ type: 'vault', title: 'VAULT UNLOCKED', message: `${r.granted_count} items granted to ${target.username || target.id}`, icon: '🗝️', duration: 4000 })
    } catch (e) {
      pushNotification({ type: 'goal', title: 'FAILED', message: e.message?.slice(0, 60) || 'Enable DEV_TOOLS=1', duration: 4000 })
    } finally {
      setVaultBusy(false)
    }
  }

  async function startSimulator() {
    setMatchBusy(true)
    if (!match) {
      setMatch({ id: 'bvb_fcb_2024_md9', home_team: 'Dortmund', away_team: 'Bayern', home_score: 0, away_score: 0, minute: 1, status: 'live', stadium: 'Signal Iduna Park', matchday: 9 })
    }
    try {
      const s = await getSocket()
      s.emit('match:join', match?.id || 'bvb_fcb_2024_md9')
      pushNotification({ type: 'prediction', title: 'SIMULATOR', message: 'Connected — events incoming', icon: '🚀', duration: 3000 })
    } catch (e) {
      pushNotification({ type: 'goal', title: 'ERROR', message: e.message, duration: 3000 })
    } finally {
      setMatchBusy(false)
    }
  }

  return (
    <div className="space-y-3 pb-24">
      <Card>
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-comic text-sm text-[var(--sv-accent)]">ADMIN PANEL</h3>
            <p className="text-xs text-[#999] mt-1">Search any user by username or email and add or remove XP.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-comic text-[#999] uppercase">Target User</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username or email"
              className="w-full px-4 py-3 rounded-xl border border-[#e0e0e0] bg-white text-sm text-[#1a1a1a] focus:border-[var(--sv-accent)] focus:outline-none"
            />
            {results.length > 0 && (
              <div className="border border-[#e0e0e0] rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
                {results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setQuery(u.username || u.email || '') }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#f7f7f7] border-b border-[#f0f0f0] last:border-b-0 ${selectedUser?.id === u.id ? 'bg-[var(--sv-accent)]/8' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[#1a1a1a] font-medium truncate">{u.username}</div>
                      <div className="text-[11px] text-[#999] truncate">{u.email || 'No email'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-comic text-[var(--sv-accent)] tabular-nums">{(u.points_total ?? 0).toLocaleString()} XP</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="rounded-xl border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1a1a1a] truncate">{selectedUser.username}</div>
                  <div className="text-[11px] text-[#999] truncate">{selectedUser.email || selectedUser.id}</div>
                </div>
                <div className="text-sm font-comic text-[var(--sv-accent)] tabular-nums">{(selectedUser.points_total ?? 0).toLocaleString()} XP</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-comic text-[#999] uppercase">XP Adjustment</label>
            <input
              type="number"
              step="1"
              value={xpDelta}
              onChange={(e) => setXpDelta(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-[#e0e0e0] bg-white text-sm text-[#1a1a1a] focus:border-[var(--sv-accent)] focus:outline-none tabular-nums"
            />
            <div className="grid grid-cols-4 gap-2">
              {[2500, 5000, 25000, -25000].map((n) => (
                <button key={n} onClick={() => setXpDelta(n)} className="py-2 rounded-xl border border-[#e0e0e0] text-[11px] font-comic text-[#666] hover:border-[var(--sv-accent)]">
                  {n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyXp(xpDelta)}
                disabled={busy}
                className="py-3 rounded-xl font-comic text-sm bg-[var(--sv-accent)] text-white disabled:opacity-50"
              >
                {busy ? 'APPLYING…' : 'APPLY XP'}
              </button>
              <button
                onClick={() => applyXp(-Math.abs(Number(xpDelta) || 0))}
                disabled={busy}
                className="py-3 rounded-xl font-comic text-sm border border-[#e0e0e0] text-[#666] disabled:opacity-50"
              >
                SUBTRACT XP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Btn label={vaultBusy ? '🗝️ Working…' : '🗝️ All Vault'} onClick={grantAllVault} disabled={vaultBusy} />
            <Btn label={matchBusy ? '🚀 Simulator…' : '🚀 Simulator'} onClick={startSimulator} disabled={matchBusy} />
          </div>
        </div>
      </Card>
    </div>
  )
}

function Btn({ label, onClick, disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className="py-2.5 px-3 rounded-xl font-comic text-[12px] bg-[var(--sv-accent)] text-white disabled:opacity-50"
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
