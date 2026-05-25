import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import Avatar, { AdminBadge } from '../components/Avatar.jsx'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'

export default function UserProfile() {
  const { userId } = useParams()
  const nav = useNavigate()
  const myId = useStore((s) => s.user?.id)
  const showToast = useStore((s) => s.showToast)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    // If viewing own profile, redirect
    if (userId === myId) { nav('/profile', { replace: true }); return }
    setLoading(true)
    api.get(`/api/users/${userId}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId, myId, nav])

  async function addFriend() {
    try {
      await api.addFriend(userId)
      showToast('Friend request sent!')
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('already_friends')) showToast('Already friends')
      else if (msg.includes('request_pending')) showToast('Request already sent')
      else showToast('Could not send request')
    }
  }

  if (loading) {
    return (
      <Layout title="PROFILE">
        <div className="flex items-center justify-center py-20">
          <span className="text-[#999]">Loading…</span>
        </div>
      </Layout>
    )
  }

  if (!profile) {
    return (
      <Layout title="PROFILE">
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#ccc] mb-3">person_off</span>
          <h2 className="font-comic text-xl text-[#1a1a1a] mb-1">User not found</h2>
          <p className="text-sm text-[#999]">This profile doesn't exist or has been deleted.</p>
          <button onClick={() => nav(-1)} className="mt-4 px-4 py-2 rounded-xl border border-[#e0e0e0] text-sm text-[#666] font-comic">Go Back</button>
        </div>
      </Layout>
    )
  }

  const cards = (profile.vault || []).filter((v) => v.type === 'collectible' || v.type === 'adidas_card')
  const badges = (profile.vault || []).filter((v) => v.type === 'badge')

  return (
    <Layout title={profile.username?.toUpperCase() || 'PROFILE'}>
      <section className="flex flex-col items-center text-center px-4 pt-6">
        <div className="mb-3">
          <Avatar url={profile.avatar_url} name={profile.username} size={100} />
        </div>
        <h1 className="font-comic text-2xl text-[#1a1a1a] flex items-center gap-2">
          {profile.username || 'User'}
          <AdminBadge username={profile.username} />
        </h1>
        <p className="text-xs text-[#999] mt-1">{(profile.prediction_title || 'Fan').toUpperCase()} · {(profile.tier || 'Fan').toUpperCase()}</p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={addFriend}
            className="px-5 py-2.5 rounded-xl font-comic text-sm bg-[var(--sv-accent)] text-white">
            Add Friend
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => nav(-1)}
            className="px-5 py-2.5 rounded-xl font-comic text-sm border border-[#e0e0e0] text-[#666]">
            Back
          </motion.button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 px-4 mt-5">
        <Stat label="ACCURACY" value={profile.predictions_made ? `${Math.round((profile.predictions_correct / profile.predictions_made) * 100)}%` : '—'} />
        <Stat label="PREDICTIONS" value={profile.predictions_made || 0} />
        <Stat label="XP" value={(profile.points_total ?? 0).toLocaleString()} />
      </section>

      {/* Cards showcase */}
      {cards.length > 0 && (
        <section className="px-4 mt-5">
          <h3 className="font-comic text-xs text-[#999] mb-2">COLLECTION ({cards.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {cards.slice(0, 6).map((c) => (
              <div key={c.id} className="aspect-[3/4] rounded-xl bg-white border border-[#e0e0e0] p-2 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[var(--sv-accent)] text-[24px]">sports_soccer</span>
                <span className="text-[8px] text-[#999] mt-1 truncate w-full text-center">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <section className="px-4 mt-4 pb-32">
          <h3 className="font-comic text-xs text-[#999] mb-2">BADGES ({badges.length})</h3>
          <div className="flex gap-2 flex-wrap">
            {badges.map((b) => (
              <div key={b.id} className="w-12 h-12 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--sv-accent)] text-[20px]">military_tech</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {cards.length === 0 && badges.length === 0 && (
        <div className="text-center py-10 text-[#bbb] text-sm">This user hasn't collected anything yet</div>
      )}
    </Layout>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl p-2 flex flex-col items-center">
      <span className="font-comic text-lg text-[#1a1a1a] tabular-nums">{value}</span>
      <span className="text-[9px] text-[#999] font-comic">{label}</span>
    </div>
  )
}
