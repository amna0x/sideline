import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import AvatarUpload from '../components/AvatarUpload.jsx'
import Avatar from '../components/Avatar.jsx'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'
import { requireSignedIn } from '../lib/guestGuard.js'

export default function Profile() {
  const user = useStore((s) => s.user)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const showToast = useStore((s) => s.showToast)
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'cards')
  const [history, setHistory] = useState([])
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  useEffect(() => {
    if (!user?.id) return
    api.get(`/api/users/${user.id}/history`).then(setHistory).catch(() => {})
    api.friends().then(setFriends).catch(() => {})
    api.friendRequests().then(setFriendRequests).catch(() => {})
  }, [user?.id])

  const profile = user?.profile || {}
  const cards = (profile.vault || []).filter((v) => v.type === 'collectible' || v.type === 'adidas_card')
  const badges = (profile.vault || []).filter((v) => v.type === 'badge')

  async function searchUsers(q) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    const results = await api.searchUsers(q).catch(() => [])
    setSearchResults(results.filter((r) => r.id !== user?.id))
  }

  async function addFriend(friendId) {
    if (!requireSignedIn('friends')) return
    try {
      await api.addFriend(friendId)
      showToast('Friend request sent!')
      setSearchResults((r) => r.filter((u) => u.id !== friendId))
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('already_friends')) showToast('Already friends')
      else if (msg.includes('request_pending')) showToast('Request already sent')
      else showToast('Could not send request')
    }
  }

  async function acceptRequest(requestId) {
    if (!requireSignedIn('friends')) return
    await api.acceptFriend(requestId).catch(() => {})
    setFriendRequests((r) => r.filter((req) => req.request_id !== requestId))
    api.friends().then(setFriends).catch(() => {})
    showToast('Friend added!')
  }

  async function removeFriend(friendId) {
    if (!requireSignedIn('friends')) return
    await api.removeFriend(friendId).catch(() => {})
    setFriends((f) => f.filter((fr) => fr.id !== friendId))
    setSelectedFriend(null)
    showToast('Friend removed')
  }

  return (
    <Layout title="PROFILE">
      <section className="flex flex-col items-center text-center px-4 pt-6">
        <div className="mb-3">
          <AvatarUpload
            userId={user?.id}
            currentUrl={profile.avatar_url}
            name={profile.username}
            size={100}
            onUploaded={(avatar_url) => { setUserProfile({ ...profile, avatar_url }); showToast('Avatar updated') }}
            onError={(msg) => showToast(msg)}
          />
        </div>
        <h1 className="font-comic text-2xl text-[#1a1a1a]">{profile.username || 'User'}</h1>
        <p className="text-xs text-[#999] mt-1">{(profile.prediction_title || 'Fan').toUpperCase()} · {(profile.tier || 'Fan').toUpperCase()}</p>
      </section>

      <section className="grid grid-cols-4 gap-2 px-4 mt-4">
        <Stat label="ACCURACY" value={profile.predictions_made ? `${Math.round((profile.predictions_correct / profile.predictions_made) * 100)}%` : '—'} />
        <Stat label="STREAK" value={profile.streak ?? 0} />
        <Stat label="XP" value={(profile.points_total ?? 0).toLocaleString()} />
        <button onClick={() => setTab('friends')} className="bg-white border border-[#e0e0e0] rounded-xl p-2 flex flex-col items-center">
          <span className="font-comic text-lg text-[var(--sv-accent)] tabular-nums">{friends.length}</span>
          <span className="text-[9px] text-[#999] font-comic">FRIENDS</span>
        </button>
      </section>

      <div className="flex p-1 mx-4 mt-4 bg-[#f5f5f5] border border-[#e0e0e0] rounded-full">
        {['cards', 'badges', 'friends', 'history'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full font-label-caps text-[10px] uppercase ${tab === t ? 'bg-[var(--sv-accent)] text-white' : 'text-[#999]'}`}>
            {t}
          </button>
        ))}
      </div>

      <section className="px-4 mt-4 pb-32">
        {tab === 'cards' && (
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.id} className="aspect-[3/4] rounded-2xl bg-white border border-[#e0e0e0] p-3 flex flex-col">
                <span className="font-label-caps text-[10px] text-[#999]">{c.tier?.toUpperCase()}</span>
                <div className="flex-1 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--sv-accent)] text-[40px]">sports_soccer</span>
                </div>
                <div className="text-sm text-[#1a1a1a] truncate">{c.name}</div>
              </div>
            ))}
            {cards.length === 0 && <Empty text="No vault cards yet — predict to earn drops" />}
          </div>
        )}
        {tab === 'badges' && (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <div key={b.id} className="aspect-square rounded-full bg-white border border-[#e0e0e0] flex flex-col items-center justify-center p-2">
                <span className="material-symbols-outlined text-[var(--sv-accent)] text-[28px]">military_tech</span>
                <span className="text-[8px] text-[#999] text-center mt-1">{b.name}</span>
              </div>
            ))}
            {badges.length === 0 && <Empty text="No badges earned yet" full />}
          </div>
        )}
        {tab === 'friends' && (
          <FriendsTab
            friends={friends}
            requests={friendRequests}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onSearch={searchUsers}
            onAdd={addFriend}
            onAccept={acceptRequest}
            onRemove={removeFriend}
            onSelect={setSelectedFriend}
          />
        )}
        {tab === 'history' && (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex justify-between items-center bg-white border border-[#e0e0e0] rounded-xl p-3">
                <div>
                  <div className="text-sm text-[#1a1a1a]">{h.home_team} vs {h.away_team}</div>
                  <div className="text-[10px] text-[#999]">MD {h.matchday} · {h.predictions_correct}/{h.predictions_made}</div>
                </div>
                <div className="font-comic text-sm text-[var(--sv-accent)]">+{h.points_earned} XP</div>
              </div>
            ))}
            {history.length === 0 && <Empty text="No match history yet" />}
          </div>
        )}
      </section>

      {/* Friend profile modal */}
      <AnimatePresence>
        {selectedFriend && <FriendModal friend={selectedFriend} onClose={() => setSelectedFriend(null)} onRemove={removeFriend} />}
      </AnimatePresence>
    </Layout>
  )
}

function FriendsTab({ friends, requests, searchQuery, searchResults, onSearch, onAdd, onAccept, onRemove, onSelect }) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text" value={searchQuery} onChange={(e) => onSearch(e.target.value)}
          placeholder="Search users to add…"
          className="w-full bg-[#f8f8f8] border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[var(--sv-accent)] focus:outline-none"
        />
        {searchResults.length > 0 && (
          <div className="mt-2 border border-[#e0e0e0] rounded-xl overflow-hidden bg-white">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2 border-b border-[#f0f0f0] last:border-b-0">
                <div className="flex items-center gap-2">
                  <Avatar url={u.avatar_url} name={u.username} size={32} />
                  <div>
                    <div className="text-sm text-[#1a1a1a]">{u.username}</div>
                    <div className="text-[10px] text-[#999]">{u.tier}</div>
                  </div>
                </div>
                <button onClick={() => onAdd(u.id)} className="px-3 py-1 rounded-full text-xs font-comic bg-[var(--sv-accent)] text-white">ADD</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div>
          <h3 className="font-comic text-xs text-[var(--sv-accent)] mb-2">FRIEND REQUESTS</h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.request_id} className="flex items-center justify-between bg-white border border-[#e0e0e0] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar url={r.avatar_url} name={r.username} size={32} />
                  <span className="text-sm text-[#1a1a1a]">{r.username}</span>
                </div>
                <button onClick={() => onAccept(r.request_id)} className="px-3 py-1 rounded-full text-xs font-comic bg-[var(--sv-accent)] text-white">ACCEPT</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <h3 className="font-comic text-xs text-[#999] mb-2">YOUR FRIENDS ({friends.length})</h3>
        {friends.length === 0 && <div className="text-center text-[#bbb] text-sm py-4">No friends yet — search above to add people</div>}
        <div className="space-y-2">
          {friends.map((f) => (
            <motion.button key={f.id} whileTap={{ scale: 0.98 }} onClick={() => onSelect(f)}
              className="w-full flex items-center gap-3 bg-white border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-left">
              <Avatar url={f.avatar_url} name={f.username} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#1a1a1a] font-medium truncate">{f.username}</div>
                <div className="text-[10px] text-[#999]">{f.tier?.toUpperCase()} · {(f.points_total || 0).toLocaleString()} XP</div>
              </div>
              <span className="material-symbols-outlined text-[#ccc] text-[18px]">chevron_right</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FriendModal({ friend, onClose, onRemove }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] bg-white rounded-2xl border border-[#e0e0e0] shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#f8f8f8] p-6 flex flex-col items-center text-center">
          <Avatar url={friend.avatar_url} name={friend.username} size={72} />
          <h2 className="font-comic text-xl text-[#1a1a1a] mt-3">{friend.username}</h2>
          <p className="text-xs text-[#999] mt-1">{friend.tier?.toUpperCase()} · {(friend.points_total || 0).toLocaleString()} XP</p>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          <button onClick={() => onRemove(friend.id)}
            className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-comic hover:bg-red-50 transition-colors">
            Remove Friend
          </button>
          <button onClick={onClose}
            className="w-full py-2.5 border border-[#e0e0e0] text-[#666] rounded-xl text-sm font-comic hover:bg-[#f5f5f5] transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
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

function Empty({ text, full }) {
  return <div className={`text-center text-[#bbb] text-sm py-6 ${full ? 'col-span-3' : 'col-span-2'}`}>{text}</div>
}
