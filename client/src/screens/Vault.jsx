import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import VaultCard from '../components/VaultCard.jsx'
import { useVault } from '../hooks/useVault.js'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'

const TIERS = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic']

const TIER_COLORS = {
  common: '#959086',
  rare: '#A0C4FF',
  epic: '#FF6B9D',
  legendary: '#FFB347',
  mythic: '#E8D5FF'
}

export default function Vault() {
  const { items, owned, loading, redeem, purchase } = useVault()
  const points = useStore((s) => s.points)
  const showToast = useStore((s) => s.showToast)
  const [tier, setTier] = useState('all')
  const [modal, setModal] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [confirmBuy, setConfirmBuy] = useState(null)
  const [buying, setBuying] = useState(false)
  const [mainTab, setMainTab] = useState('items')
  const [cosmeticsList, setCosmeticsList] = useState([])
  const [cosmeticsLoading, setCosmeticsLoading] = useState(false)
  const [cosmeticOwned, setCosmeticOwned] = useState([])
  const userId = useStore((s) => s.user?.id)

  const ownedById = useMemo(() => Object.fromEntries((owned || []).map((o) => [o.vault_item_id, o])), [owned])
  const filtered = useMemo(
    () => (items || []).filter((i) => tier === 'all' || i.tier === tier),
    [items, tier]
  )

  // Load cosmetics when tab is active
  useEffect(() => {
    if (mainTab !== 'cosmetics') return
    setCosmeticsLoading(true)
    Promise.all([
      api.cosmetics().catch(() => []),
      userId ? api.userCosmetics(userId).catch(() => []) : Promise.resolve([])
    ]).then(([all, owned]) => {
      setCosmeticsList(all)
      setCosmeticOwned(owned)
    }).finally(() => setCosmeticsLoading(false))
  }, [mainTab, userId])

  function handleClick(item) {
    const o = ownedById[item.id]
    // Always show detail popup first
    setDetailItem({ item, owned: !!o, ownedRecord: o })
  }

  async function handleRedeem(item, ownedRecord) {
    if (!ownedRecord) return
    if (!ownedRecord.redeemed) {
      try {
        const result = await redeem(ownedRecord.id)
        setDetailItem(null)
        setModal({ item, code: result.code })
      } catch (e) { showToast(e.message || 'redeem failed') }
    } else {
      setDetailItem(null)
      setModal({ item, code: ownedRecord.code, alreadyRedeemed: true })
    }
  }

  function handleBuy(item) {
    const cost = item.points_cost || 0
    if (points < cost) {
      showToast(`Need ${(cost - points).toLocaleString()} more XP`)
    } else if ((item.remaining_supply ?? 0) <= 0) {
      showToast('Sold out')
    } else {
      setDetailItem(null)
      setConfirmBuy(item)
    }
  }

  async function confirmPurchase() {
    if (!confirmBuy) return
    setBuying(true)
    try {
      await purchase(confirmBuy.id)
      const item = confirmBuy
      setConfirmBuy(null)
      showToast(`${item.name} unlocked!`)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('insufficient_points')) showToast('Not enough XP')
      else if (msg.includes('already_owned')) showToast('Already owned')
      else if (msg.includes('sold_out')) showToast('Sold out')
      else showToast(msg || 'purchase failed')
    } finally { setBuying(false) }
  }

  return (
    <Layout title="THE VAULT">
      <section className="px-4 pt-4 pb-32">
        <h1 className="font-h2 text-h2 text-primary-container">THE VAULT</h1>
        <p className="text-on-surface-variant text-sm mb-4">Collectibles, badges, frames, and Adidas drops.</p>

        {/* Main tabs: Items / Cosmetics */}
        <div className="flex border border-[#565449] rounded-full p-1 mb-4 bg-[#0a0a0a]">
          <button onClick={() => setMainTab('items')}
            className={`flex-1 py-2 text-center font-comic text-xs rounded-full transition-all ${mainTab === 'items' ? 'bg-[var(--sv-accent)] text-white' : 'text-[#999]'}`}>
            ITEMS
          </button>
          <button onClick={() => setMainTab('cosmetics')}
            className={`flex-1 py-2 text-center font-comic text-xs rounded-full transition-all ${mainTab === 'cosmetics' ? 'bg-[var(--sv-accent)] text-white' : 'text-[#999]'}`}>
            COSMETICS
          </button>
        </div>

        {mainTab === 'items' && (<>
        <div className="flex overflow-x-auto pb-2 mb-4 gap-2 hide-scrollbar snap-x">
          {TIERS.map((t) => (
            <button key={t} onClick={() => setTier(t)}
              className={`snap-start shrink-0 px-3 py-1.5 rounded-full font-label-caps text-label-caps uppercase border transition-all ${
                tier === t ? 'bg-primary-container text-background border-primary-container shadow-[0_0_12px_rgba(216,207,188,0.4)]' : 'border-outline-variant text-on-surface-variant'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Stat label="ACQUIRED" value={`${owned.length}`} sub={`/ ${items.length}`} />
          <Stat label="POINTS" value={points.toLocaleString()} />
          <Stat label="LEGENDARY" value={owned.filter((o) => items.find((i) => i.id === o.vault_item_id)?.tier === 'legendary').length} />
        </div>

        {loading
          ? <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map((i) => <div key={i} className="h-[200px] bg-surface-container-low rounded-2xl animate-pulse" />)}</div>
          : (
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden" animate="show"
              className="grid grid-cols-2 gap-3 pb-28"
            >
              {filtered.map((item) => (
                <motion.div key={item.id}
                  variants={{ hidden: { y: 12, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                  <VaultCard item={item} owned={!!ownedById[item.id]} points={points} onClick={() => handleClick(item)} />
                </motion.div>
              ))}
              {filtered.length === 0 && <div className="col-span-2 text-center text-outline py-8">No items in this tier</div>}
            </motion.div>
          )}
        </>)}

        {mainTab === 'cosmetics' && (
          <CosmeticsTab
            cosmetics={cosmeticsList}
            owned={cosmeticOwned}
            loading={cosmeticsLoading}
            points={points}
            userId={userId}
            showToast={showToast}
            onPurchased={() => {
              api.userCosmetics(userId).then(setCosmeticOwned).catch(() => {})
              api.user(userId).then((p) => useStore.getState().setUserProfile(p)).catch(() => {})
            }}
          />
        )}
      </section>

      <AnimatePresence>
        {detailItem && <DetailModal {...detailItem} points={points} onClose={() => setDetailItem(null)} onRedeem={handleRedeem} onBuy={handleBuy} />}
        {modal && <RedeemModal {...modal} onClose={() => setModal(null)} />}
        {confirmBuy && <PurchaseModal item={confirmBuy} points={points} busy={buying} onCancel={() => setConfirmBuy(null)} onConfirm={confirmPurchase} />}
      </AnimatePresence>
    </Layout>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="bg-surface-container-low border border-[#565449] rounded-DEFAULT p-2 flex flex-col">
      <span className="font-label-caps text-[10px] text-outline">{label}</span>
      <div className="flex items-end gap-1">
        <span className="font-h3 text-h3 text-primary-container leading-none tabular-nums">{value}</span>
        {sub && <span className="text-xs text-on-surface-variant mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

function DetailModal({ item, owned, ownedRecord, points, onClose, onRedeem, onBuy }) {
  const t = TIER_COLORS[item.tier] || TIER_COLORS.common
  const cost = item.points_cost || 0
  const canAfford = points >= cost

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)]" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] max-h-[calc(100dvh-8rem)] rounded-3xl overflow-y-auto"
        style={{ boxShadow: `0 0 60px ${t}33, 0 0 120px ${t}11` }}
      >
        {/* Card-shaped top section */}
        <div
          className="min-h-[320px] max-h-[46dvh] relative flex flex-col items-center justify-center p-6"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${t}22 0%, #0a0a0a 70%)`, borderBottom: `1px solid ${t}44` }}
        >
          {/* Tier badge */}
          <div className="absolute top-4 left-4 px-2 py-1 rounded-md text-[10px] font-label-caps" style={{ color: t, backgroundColor: `${t}15` }}>
            {(item.tier || 'common').toUpperCase()}
          </div>
          <div className="absolute top-4 right-4 text-[10px] font-label-caps text-outline">
            {item.remaining_supply}/{item.total_supply}
          </div>

          {/* Big icon */}
          <motion.span
            className="material-symbols-outlined"
            style={{ color: t, fontSize: '72px', fontVariationSettings: "'FILL' 1", textShadow: `0 0 30px ${t}88, 0 0 60px ${t}44` }}
            animate={item.tier === 'legendary' || item.tier === 'mythic' ? { scale: [1, 1.05, 1] } : undefined}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {item.type === 'adidas_card' ? 'sports_soccer' : item.type === 'badge' ? 'military_tech' : item.type === 'profile_frame' ? 'badge' : 'emoji_events'}
          </motion.span>

          <h2 className="font-comic text-xl text-on-surface mt-4 text-center">{item.name}</h2>
          <p className="text-sm text-on-surface-variant mt-1 text-center capitalize">{item.type?.replace('_', ' ')}</p>
        </div>

        {/* Bottom info section */}
        <div className="bg-surface-container-low p-5 pb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xs text-outline font-label-caps">COST</span>
              <div className="font-comic text-lg" style={{ color: t }}>{cost.toLocaleString()} XP</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-outline font-label-caps">YOUR BALANCE</span>
              <div className="font-comic text-lg text-on-surface">{points.toLocaleString()} XP</div>
            </div>
          </div>

          {owned ? (
            <button
              onClick={() => onRedeem(item, ownedRecord)}
              className="w-full py-3 rounded-full font-comic text-base text-background"
              style={{ backgroundColor: t }}
            >
              {ownedRecord?.redeemed ? 'VIEW CODE' : 'REDEEM'}
            </button>
          ) : (
            <button
              onClick={() => onBuy(item)}
              disabled={!canAfford || (item.remaining_supply ?? 0) <= 0}
              className="w-full py-3 rounded-full font-comic text-base text-background disabled:opacity-40"
              style={{ backgroundColor: t }}
            >
              {(item.remaining_supply ?? 0) <= 0 ? 'SOLD OUT' : !canAfford ? `NEED ${(cost - points).toLocaleString()} MORE XP` : 'UNLOCK'}
            </button>
          )}

          <button onClick={onClose} className="w-full mt-2 py-2 text-center text-sm text-outline font-comic">CLOSE</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RedeemModal({ item, code, alreadyRedeemed, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)]" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] bg-surface-container-low border border-primary-container rounded-3xl p-6 shadow-[0_0_30px_rgba(216,207,188,0.25)] flex flex-col">
        <h2 className="font-h2 text-h2 text-primary-container text-center">{alreadyRedeemed ? 'YOUR CODE' : 'REDEEMED!'}</h2>
        <p className="text-center text-on-surface-variant mb-4">{item.name}</p>
        <div className="bg-background border border-primary-container rounded-DEFAULT p-4 text-center font-mono text-h3 text-primary tracking-widest mb-4">
          {code || '—'}
        </div>
        <button onClick={onClose} className="w-full py-3 bg-primary-container text-background rounded-full font-label-caps text-label-caps">CLOSE</button>
      </motion.div>
    </motion.div>
  )
}

function PurchaseModal({ item, points, busy, onCancel, onConfirm }) {
  const cost = item.points_cost || 0
  const after = points - cost
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)]" onClick={busy ? undefined : onCancel}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] bg-surface-container-low border border-primary-container rounded-3xl p-6 shadow-[0_0_30px_rgba(216,207,188,0.25)] flex flex-col">
        <h2 className="font-h2 text-h2 text-primary-container text-center">UNLOCK?</h2>
        <p className="text-center text-on-surface-variant mb-4">{item.name}</p>
        <div className="bg-background border border-outline rounded-DEFAULT p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-outline">Cost</span><span className="text-on-surface tabular-nums">{cost.toLocaleString()} XP</span></div>
          <div className="flex justify-between text-sm"><span className="text-outline">Balance</span><span className="text-on-surface tabular-nums">{points.toLocaleString()} XP</span></div>
          <div className="h-px bg-outline-variant my-1" />
          <div className="flex justify-between text-sm"><span className="text-outline">After</span><span className="text-primary-container tabular-nums">{after.toLocaleString()} XP</span></div>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={onCancel} className="flex-1 py-3 border border-outline rounded-full font-label-caps text-label-caps text-on-surface-variant disabled:opacity-50">CANCEL</button>
          <button disabled={busy} onClick={onConfirm} className="flex-1 py-3 bg-primary-container text-background rounded-full font-label-caps text-label-caps disabled:opacity-50">{busy ? 'UNLOCKING…' : 'UNLOCK'}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const COSMETIC_PREVIEWS = {
  deco_fire: { icon: 'local_fire_department', color: '#ff6b3b', anim: 'pulse' },
  deco_lightning: { icon: 'bolt', color: '#5aa8ff', anim: 'pulse' },
  deco_crown: { icon: 'crown', color: '#ffc94a', anim: 'float' },
  deco_stars: { icon: 'star', color: '#E8D5FF', anim: 'twinkle' },
  deco_neon: { icon: 'blur_on', color: '#00f6ac', anim: 'pulse' },
  effect_confetti: { icon: 'celebration', color: '#ff6b9d', anim: 'float' },
  effect_sparkle: { icon: 'auto_awesome', color: '#ffc94a', anim: 'twinkle' },
  effect_flames: { icon: 'whatshot', color: '#ff3b6b', anim: 'pulse' },
  gif_unlock: { icon: 'gif_box', color: '#00f6ac', anim: 'float' },
  sticker_bundesliga: { icon: 'sports_soccer', color: '#5aa8ff', anim: 'float' },
  sticker_reactions: { icon: 'sentiment_very_satisfied', color: '#ffc94a', anim: 'float' }
}

const TIER_BADGE = {
  common: { bg: 'bg-gray-100', text: 'text-gray-600' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-600' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-600' },
  legendary: { bg: 'bg-yellow-100', text: 'text-yellow-700' }
}

function CosmeticsTab({ cosmetics, owned, loading, points, userId, showToast, onPurchased }) {
  const [buying, setBuying] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const setPoints = useStore((s) => s.setPoints)
  const ownedIds = new Set(owned.map((o) => o.cosmetic_id))

  async function handlePurchase(cosmetic) {
    if (ownedIds.has(cosmetic.id)) { showToast('Already owned!'); return }
    if (points < cosmetic.xp_cost) { showToast(`Need ${(cosmetic.xp_cost - points).toLocaleString()} more XP`); return }
    setConfirmItem(cosmetic)
  }

  async function confirmPurchase() {
    if (!confirmItem) return
    setBuying(confirmItem.id)
    try {
      const result = await api.purchaseCosmetic(confirmItem.id)
      if (result.new_balance != null) setPoints(result.new_balance)
      showToast(`${confirmItem.name} unlocked!`)
      onPurchased()
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('already_owned')) showToast('Already owned')
      else if (msg.includes('insufficient_xp')) showToast('Not enough XP')
      else showToast('Purchase failed')
    } finally { setBuying(null); setConfirmItem(null) }
  }

  if (loading) return <div className="py-12 text-center text-sm text-[#999]">Loading cosmetics…</div>
  if (cosmetics.length === 0) return <div className="py-12 text-center text-sm text-[#999]">No cosmetics available</div>

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

  return (
    <div className="space-y-5 pb-28">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="OWNED" value={owned.length} sub={`/ ${cosmetics.length}`} />
        <Stat label="XP" value={points.toLocaleString()} />
        <Stat label="EQUIPPED" value={owned.filter((o) => o.equipped).length} />
      </div>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h3 className="font-comic text-xs text-[var(--sv-accent)] mb-3">{typeLabels[type] || type}</h3>
          <div className="space-y-3">
            {items.map((c) => {
              const isOwned = ownedIds.has(c.id)
              const preview = COSMETIC_PREVIEWS[c.id] || { icon: 'auto_awesome', color: '#999', anim: 'pulse' }
              const tierStyle = TIER_BADGE[c.tier] || TIER_BADGE.common
              return (
                <motion.div key={c.id} whileTap={{ scale: 0.98 }}
                  className={`rounded-2xl border p-4 transition-all ${isOwned ? 'border-[var(--sv-accent)]/40 bg-[var(--sv-accent)]/5' : 'border-[#e0e0e0] bg-white'}`}>
                  <div className="flex items-start gap-3">
                    {/* Preview icon with animation */}
                    <motion.div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${preview.color}15` }}
                      animate={preview.anim === 'pulse' ? { scale: [1, 1.08, 1] } : preview.anim === 'float' ? { y: [0, -3, 0] } : { opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span className="material-symbols-outlined text-[28px]" style={{ color: preview.color, fontVariationSettings: "'FILL' 1" }}>{preview.icon}</span>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#1a1a1a] font-medium">{c.name}</span>
                        <span className={`text-[9px] font-comic px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.text}`}>{(c.tier || 'common').toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-[#999] mt-0.5">{c.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-comic text-[var(--sv-accent)]">{c.xp_cost.toLocaleString()} XP</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0">
                      {isOwned ? (
                        <span className="text-[10px] font-comic text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">OWNED</span>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePurchase(c)}
                          disabled={buying === c.id || points < c.xp_cost}
                          className="px-3 py-1.5 rounded-lg font-comic text-[11px] bg-[var(--sv-accent)] text-white disabled:opacity-40"
                        >
                          {buying === c.id ? '…' : 'BUY'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Purchase confirmation */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)]" onClick={() => setConfirmItem(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[300px] bg-white rounded-2xl border border-[#e0e0e0] p-5 shadow-lg">
            <h3 className="font-comic text-lg text-[#1a1a1a] text-center mb-1">Purchase?</h3>
            <p className="text-sm text-[#666] text-center mb-4">{confirmItem.name}</p>
            <div className="bg-[#f8f8f8] rounded-xl p-3 mb-4 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-[#999]">Cost</span><span className="text-[#1a1a1a] font-comic">{confirmItem.xp_cost.toLocaleString()} XP</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#999]">Balance</span><span className="text-[#1a1a1a] font-comic">{points.toLocaleString()} XP</span></div>
              <div className="h-px bg-[#e0e0e0]" />
              <div className="flex justify-between text-sm"><span className="text-[#999]">After</span><span className="text-[var(--sv-accent)] font-comic">{(points - confirmItem.xp_cost).toLocaleString()} XP</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmItem(null)} className="flex-1 py-2.5 border border-[#e0e0e0] rounded-xl font-comic text-sm text-[#666]">CANCEL</button>
              <button onClick={confirmPurchase} disabled={buying} className="flex-1 py-2.5 bg-[var(--sv-accent)] text-white rounded-xl font-comic text-sm disabled:opacity-50">{buying ? '…' : 'BUY'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
