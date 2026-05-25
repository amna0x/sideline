import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import VaultCard from '../components/VaultCard.jsx'
import { useVault } from '../hooks/useVault.js'
import { useStore } from '../store/index.js'

const TIERS = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic']

export default function Vault() {
  const { items, owned, loading, redeem, purchase } = useVault()
  const points = useStore((s) => s.points)
  const showToast = useStore((s) => s.showToast)
  const [tier, setTier] = useState('all')
  const [modal, setModal] = useState(null)
  const [confirmBuy, setConfirmBuy] = useState(null)
  const [buying, setBuying] = useState(false)

  const ownedById = useMemo(() => Object.fromEntries((owned || []).map((o) => [o.vault_item_id, o])), [owned])
  const filtered = useMemo(
    () => (items || []).filter((i) => tier === 'all' || i.tier === tier),
    [items, tier]
  )

  async function handleClick(item) {
    const o = ownedById[item.id]
    if (o) {
      if (!o.redeemed) {
        try {
          const result = await redeem(o.id)
          setModal({ item, code: result.code })
        } catch (e) { showToast(e.message || 'redeem failed') }
      } else setModal({ item, code: o.code, alreadyRedeemed: true })
    } else {
      const cost = item.points_cost || 0
      if (points < cost) {
        showToast(`Need ${(cost - points).toLocaleString()} more XP`)
      } else if ((item.remaining_supply ?? 0) <= 0) {
        showToast('Sold out')
      } else {
        setConfirmBuy(item)
      }
    }
  }

  async function confirmPurchase() {
    if (!confirmBuy) return
    setBuying(true)
    try {
      await purchase(confirmBuy.id)
      const item = confirmBuy
      setConfirmBuy(null)
      showToast(`${item.name} unlocked`)
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
      <section className="px-4 pt-4">
        <h1 className="font-h2 text-h2 text-primary-container">THE VAULT</h1>
        <p className="text-on-surface-variant text-sm mb-4">Operational drops, badges, frames, and Adidas collectibles. Glow = ownership.</p>

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
          ? <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map((i) => <div key={i} className="aspect-[3/4] bg-surface-container-low rounded-2xl animate-pulse" />)}</div>
          : (
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden" animate="show"
              className="grid grid-cols-2 gap-3 pb-8"
            >
              {filtered.map((item) => (
                <motion.div key={item.id}
                  variants={{ hidden: { y: 12, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                  whileHover={{ scale: 1.02 }}>
                  <VaultCard item={item} owned={!!ownedById[item.id]} points={points} onClick={() => handleClick(item)} />
                </motion.div>
              ))}
              {filtered.length === 0 && <div className="col-span-2 text-center text-outline py-8">No items in this tier</div>}
            </motion.div>
          )}
      </section>

      <AnimatePresence>
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

function RedeemModal({ item, code, alreadyRedeemed, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] bg-surface-container-low border border-primary-container rounded-3xl p-6 shadow-[0_0_30px_rgba(216,207,188,0.25)] flex flex-col">
        <h2 className="font-h2 text-h2 text-primary-container text-center">{alreadyRedeemed ? 'CODE' : 'REDEEMED'}</h2>
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
                className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={busy ? undefined : onCancel}>
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
