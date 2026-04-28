import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'

export default function Profile() {
  const user = useStore((s) => s.user)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const showToast = useStore((s) => s.showToast)
  const [tab, setTab] = useState('cards')
  const [history, setHistory] = useState([])
  const fileRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    api.get(`/api/users/${user.id}/history`).then(setHistory).catch(() => {})
  }, [user?.id])

  async function onAvatar(e) {
    const file = e.target.files?.[0]
    if (!file || !user?.id || !supabase) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return showToast(error.message)
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await api.updateUser(user.id, { avatar_url: data.publicUrl })
    setUserProfile({ ...(user.profile || {}), avatar_url: data.publicUrl })
    showToast('Avatar updated')
  }

  const profile = user?.profile || {}
  const cards = (profile.vault || []).filter((v) => v.type === 'collectible' || v.type === 'adidas_card')
  const badges = (profile.vault || []).filter((v) => v.type === 'badge')

  return (
    <Layout title="OPERATIVE">
      <section className="flex flex-col items-center text-center px-4 pt-6">
        <div className="relative mb-3">
          <div className="absolute -inset-1 bg-primary-container/30 rounded-full blur-md animate-pulse" />
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary-container z-10 bg-surface-container-low shadow-[0_0_20px_rgba(216,207,188,0.2)]">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline text-[42px]">person</span></div>}
          </div>
          <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-primary-container text-background rounded-full flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onAvatar} className="hidden" />
        </div>
        <h1 className="font-h2 text-h2 text-primary-container">{profile.username || 'OPERATIVE'}</h1>
        <p className="font-label-caps text-label-caps text-outline mt-1 tracking-[0.2em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#565449]" />
          {(profile.prediction_title || 'FAN').toUpperCase()} · {(profile.tier || 'FAN').toUpperCase()}
          <span className="w-1.5 h-1.5 rounded-full bg-[#565449]" />
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2 px-4 mt-5">
        <Stat label="ACCURACY" value={profile.predictions_made ? `${Math.round((profile.predictions_correct / profile.predictions_made) * 100)}%` : '—'} />
        <Stat label="STREAK" value={profile.streak ?? 0} pulse />
        <Stat label="TOTAL XP" value={(profile.points_total ?? 0).toLocaleString()} />
      </section>

      <div className="flex p-1 mx-4 mt-5 bg-surface-container-low border border-outline-variant rounded-full">
        {['cards', 'badges', 'history'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full font-label-caps text-label-caps uppercase ${tab === t ? 'bg-primary-container text-background' : 'text-outline'}`}>
            {t}
          </button>
        ))}
      </div>

      <section className="px-4 mt-4 pb-32">
        {tab === 'cards' && (
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.id} className="aspect-[3/4] rounded-2xl bg-surface-container border border-[#565449] p-3 flex flex-col">
                <span className="font-label-caps text-[10px] text-outline">{c.tier?.toUpperCase()}</span>
                <div className="flex-1 flex items-center justify-center">
                  {c.image_url ? <img src={c.image_url} alt="" className="w-20 h-20 object-contain" /> : <span className="material-symbols-outlined text-primary-container text-[40px]">sports_soccer</span>}
                </div>
                <div className="font-body-md text-on-surface truncate">{c.name}</div>
              </div>
            ))}
            {cards.length === 0 && <Empty text="No vault cards yet — predict to earn drops" />}
          </div>
        )}
        {tab === 'badges' && (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <div key={b.id} className="aspect-square rounded-full bg-surface-container-low border border-[#565449] flex flex-col items-center justify-center p-2">
                <span className="material-symbols-outlined text-primary-container text-[28px] drop-shadow-[0_0_8px_rgba(216,207,188,0.4)]">military_tech</span>
                <span className="font-label-caps text-[8px] text-outline text-center mt-1">{b.name}</span>
              </div>
            ))}
            {badges.length === 0 && <Empty text="No badges earned yet" full />}
          </div>
        )}
        {tab === 'history' && (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex justify-between items-center bg-surface-container-low border border-[#565449] rounded-DEFAULT p-3">
                <div>
                  <div className="font-body-md text-on-surface">{h.home_team} vs {h.away_team}</div>
                  <div className="font-label-caps text-[10px] text-outline">MD {h.matchday} · {h.predictions_correct}/{h.predictions_made}</div>
                </div>
                <div className="font-label-caps text-label-caps text-primary-container">+{h.points_earned} XP</div>
              </div>
            ))}
            {history.length === 0 && <Empty text="No match history yet" />}
          </div>
        )}
      </section>
    </Layout>
  )
}

function Stat({ label, value, pulse }) {
  return (
    <div className="bg-surface-container-low border border-[#565449] rounded-DEFAULT p-3 flex flex-col items-center relative">
      {pulse && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />}
      <span className="font-label-caps text-label-caps text-outline">{label}</span>
      <span className="font-h3 text-h3 text-primary-container mt-1 tabular-nums">{value}</span>
    </div>
  )
}
function Empty({ text, full }) {
  return <div className={`text-center text-outline text-sm py-6 ${full ? 'col-span-3' : 'col-span-2'}`}>{text}</div>
}
