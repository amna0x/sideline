import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import Avatar, { AdminBadge } from '../components/Avatar.jsx'
import ProfileEffects from '../components/ProfileEffects.jsx'
import { VaultMiniCard } from '../components/VaultCard.jsx'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'

export default function UserProfile() {
  const { userId } = useParams()
  const nav = useNavigate()
  const myId = useStore((s) => s.user?.id)
  const showToast = useStore((s) => s.showToast)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState(null) // null | 'friends' | 'pending' | 'none'
  const [userSquad, setUserSquad] = useState(undefined) // undefined = loading, null = none

  useEffect(() => {
    if (!userId) return
    // If viewing own profile, redirect
    if (userId === myId) { nav('/profile', { replace: true }); return }
    setLoading(true)
    api.get(`/api/users/${userId}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
    // Fetch user's squad
    api.get(`/api/squad/user/${userId}`).then(setUserSquad).catch(() => setUserSquad(null))
    // Check friendship status
    if (myId) {
      api.friends().then((friends) => {
        if (friends.some((f) => f.id === userId)) {
          setFriendStatus('friends')
        } else {
          api.outgoingRequests().then((out) => {
            if (out.some((r) => r.to_id === userId)) setFriendStatus('pending')
            else setFriendStatus('none')
          }).catch(() => setFriendStatus('none'))
        }
      }).catch(() => setFriendStatus('none'))
    }
  }, [userId, myId, nav])

  async function addFriend() {
    try {
      await api.addFriend(userId)
      setFriendStatus('pending')
      showToast('Friend request sent!')
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('already_friends')) { setFriendStatus('friends'); showToast('Already friends') }
      else if (msg.includes('request_pending')) { setFriendStatus('pending'); showToast('Request already sent') }
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

  const equippedDecoration = profile.equipped_cosmetics?.find(c => c.type === 'avatar_decoration')?.id
  const equippedEffect = profile.equipped_cosmetics?.find(c => c.type === 'profile_effect')?.id

  return (
    <Layout title={profile.username?.toUpperCase() || 'PROFILE'}>
      <div className="relative overflow-hidden bg-white border border-[#e0e0e0] rounded-3xl mx-4 mt-4 p-4 shadow-sm">
        <ProfileEffects effectId={equippedEffect} />
        
        <section className="flex flex-col items-center text-center relative z-10 pt-2">
          <div className="mb-3">
            <Avatar url={profile.avatar_url} name={profile.username} size={100} decorationId={equippedDecoration} />
          </div>
          <h1 className="font-comic text-2xl text-[#1a1a1a] flex items-center gap-2">
            {profile.username || 'User'}
            <AdminBadge username={profile.username} />
          </h1>
          {profile.bio && <p className="text-sm text-[#1a1a1a] mt-2 max-w-[280px] text-center">{profile.bio}</p>}
          <p className="text-xs text-[#999] mt-1">{(profile.tier || 'Fan').toUpperCase()}</p>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {friendStatus === 'friends' && (
              <span className="px-5 py-2.5 rounded-xl font-comic text-sm bg-[#f0f0f0] text-[#666] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check</span> Friends
              </span>
            )}
            {friendStatus === 'pending' && (
              <span className="px-5 py-2.5 rounded-xl font-comic text-sm border border-[var(--sv-accent)]/30 text-[var(--sv-accent)]">
                Request Sent
              </span>
            )}
            {friendStatus === 'none' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={addFriend}
                className="px-5 py-2.5 rounded-xl font-comic text-sm bg-[var(--sv-accent)] text-white">
                Add Friend
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => nav(-1)}
              className="px-5 py-2.5 rounded-xl font-comic text-sm border border-[#e0e0e0] text-[#666]">
              Back
            </motion.button>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-3 gap-2 px-4 mt-5">
        <Stat label="ACCURACY" value={profile.predictions_made ? `${Math.round((profile.predictions_correct / profile.predictions_made) * 100)}%` : '—'} />
        <Stat label="PREDICTIONS" value={profile.predictions_made || 0} />
        <Stat label="XP" value={(profile.points_total ?? 0).toLocaleString()} />
      </section>

      {/* Squad info */}
      {userSquad && (
        <section className="px-4 mt-4">
          <div className="bg-white border border-[#e0e0e0] rounded-xl p-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--sv-accent)] text-[24px]">groups</span>
            <div>
              <span className="font-comic text-xs text-[#999]">SQUAD</span>
              {userSquad.visibility === 'private' ? (
                <div className="text-sm text-[#666] font-comic">PRIVATE</div>
              ) : (
                <div className="text-sm text-[#1a1a1a] font-medium">{userSquad.name}</div>
              )}
            </div>
            {userSquad.visibility !== 'private' && (
              <span className="ml-auto text-[10px] text-[#999]">{userSquad.memberCount} members</span>
            )}
          </div>
        </section>
      )}

      {/* Cards showcase */}
      {cards.length > 0 && (
        <section className="px-4 mt-5">
          <h3 className="font-comic text-xs text-[#999] mb-2">COLLECTION ({cards.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {cards.slice(0, 6).map((c) => (
              <VaultMiniCard key={c.id} item={c} />
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
              <div key={b.id} className="w-24">
                <VaultMiniCard item={b} compact />
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
