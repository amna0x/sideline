import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { useStore } from '../store/index.js'
import { useAuth } from '../hooks/useAuth.js'
import { api } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { THEMES } from '../lib/theme.js'

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
  const [dark, setDark] = useState(localStorage.getItem('darkmode') !== 'light')
  const [strava, setStrava] = useState(profile.strava_connected ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('darkmode', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => setName(profile.username || ''), [profile.username])

  async function saveName() {
    if (!user?.id || !name.trim()) return
    await api.updateUser(user.id, { username: name.trim() })
    setUserProfile({ ...profile, username: name.trim() })
    setEditingName(false); showToast('Username updated')
  }

  async function changePassword() {
    const pw = window.prompt('New password (min 6 chars):')
    if (!pw || pw.length < 6) return
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({ password: pw })
    showToast(error ? error.message : 'Password updated')
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

  async function toggleStrava() {
    const next = !strava
    setStrava(next)
    if (user?.id) await api.updateUser(user.id, { strava_connected: next })
    showToast(next ? 'Strava linked (stub)' : 'Strava disconnected')
  }

  async function deleteAccount() {
    if (!supabase || !user?.id) return
    await api.delete(`/api/users/${user.id}`)
    await supabase.auth.signOut()
    nav('/login', { replace: true })
  }

  return (
    <Layout title="SETTINGS">
      <section className="px-4 pt-4">
        <h1 className="font-h2 text-h2 text-primary-container">System Settings</h1>
        <p className="font-body-md text-on-surface-variant text-sm mb-5">Configure parameters and integrations.</p>

        <Group title="ACCOUNT">
          <Row icon="badge" title="Identity" sub={editingName ? null : (profile.username || 'Set callsign')}>
            {editingName ? (
              <div className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border border-[#565449] rounded px-2 py-1 text-sm w-32" />
                <button onClick={saveName} className="text-primary-container">save</button>
              </div>
            ) : <button onClick={() => setEditingName(true)} className="text-primary-container text-sm">EDIT</button>}
          </Row>
          <Row icon="shield_lock" title="Security" sub="Password & 2FA">
            <button onClick={changePassword} className="text-primary-container text-sm">CHANGE</button>
          </Row>
          <Row icon="verified" title="Tier" sub={`Current: ${(profile.tier || 'FAN').toUpperCase()}`} chevron />
        </Group>

        <Group title="PREFERENCES">
          <Row icon="notifications_active" title="Telemetry Alerts" sub="Push for goals + drops">
            <Toggle on={notif} onClick={toggleNotif} />
          </Row>
          <Row icon="dark_mode" title="Tactical Interface" sub="Dark mode">
            <Toggle on={dark} onClick={() => setDark(!dark)} />
          </Row>
        </Group>

        <Group title="THEMES">
          <div className="p-4 grid grid-cols-2 gap-3">
            {Object.values(THEMES).map((t) => {
              const active = theme === t.id
              return (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`text-left rounded-DEFAULT border p-3 transition-all ${active ? 'border-primary-container shadow-[0_0_15px_rgba(216,207,188,0.25)]' : 'border-[#565449] hover:border-primary-container/60'}`}>
                  <div className="flex gap-1 mb-2">
                    {t.swatches.map((c) => (
                      <span key={c} className="w-6 h-6 rounded-full border border-black/40" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="font-body-md text-on-surface">{t.name}</div>
                  <div className="font-label-caps text-[10px] text-outline">{active ? 'ACTIVE' : 'TAP TO APPLY'}</div>
                </button>
              )
            })}
          </div>
        </Group>

        <Group title="INTEGRATIONS">
          <Row icon="directions_run" title="Strava" sub="Sync activity logs">
            <Toggle on={strava} onClick={toggleStrava} />
          </Row>
        </Group>

        <Group title="CRITICAL ACTIONS" tone="error">
          <button onClick={signOut} className="w-full flex items-center justify-between p-4 hover:bg-error/10 transition-colors border-b border-error/20">
            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-error">logout</span>
              <div className="text-left"><div className="font-body-lg text-error">Sign Out</div><div className="text-sm text-on-surface-variant">End session</div></div>
            </div>
          </button>
          <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-between p-4 hover:bg-error/10 transition-colors">
            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-error">delete_forever</span>
              <div className="text-left"><div className="font-body-lg text-error">Terminate Account</div><div className="text-sm text-on-surface-variant">Permanent deletion</div></div>
            </div>
          </button>
        </Group>
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-error rounded-2xl p-5 max-w-xs w-full">
            <h3 className="font-h3 text-error mb-2">Terminate?</h3>
            <p className="text-sm text-on-surface-variant mb-4">All data will be permanently deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-outline-variant rounded-full">CANCEL</button>
              <button onClick={deleteAccount} className="flex-1 py-2 bg-error text-on-error rounded-full font-label-caps text-label-caps">CONFIRM</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Group({ title, tone, children }) {
  const lineColor = tone === 'error' ? 'bg-error' : 'bg-[#565449]'
  const textColor = tone === 'error' ? 'text-error' : 'text-primary-container'
  const border = tone === 'error' ? 'border-error/50 bg-[#1B1C16]' : 'border-[#565449] bg-surface-container-low'
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2 opacity-80">
        <div className={`h-px w-6 ${lineColor}`} />
        <h3 className={`font-label-caps text-label-caps ${textColor}`}>{title}</h3>
        <div className={`h-px flex-1 ${lineColor}`} />
      </div>
      <div className={`border rounded-2xl flex flex-col overflow-hidden ${border}`}>{children}</div>
    </section>
  )
}

function Row({ icon, title, sub, children, chevron }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#565449]/40 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-outline">{icon}</span>
        <div className="flex flex-col items-start min-w-0">
          <span className="font-body-lg text-on-surface truncate">{title}</span>
          {sub && <span className="text-sm text-on-surface-variant truncate">{sub}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {chevron && <span className="material-symbols-outlined text-outline">chevron_right</span>}
      </div>
    </div>
  )
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-[#D8CFBC] shadow-[0_0_10px_rgba(216,207,188,0.3)]' : 'bg-surface-container-highest border border-outline-variant'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${on ? 'bg-[#11120D] translate-x-6' : 'bg-outline translate-x-1'}`} />
    </button>
  )
}
