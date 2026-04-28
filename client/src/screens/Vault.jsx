import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout.jsx'
import VaultCard from '../components/VaultCard.jsx'
import { useVault } from '../hooks/useVault.js'
import { useStore } from '../store/index.js'

const TIERS = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic']

export default function Vault() {
  const { items, owned, loading, redeem } = useVault()
  const points = useStore((s) => s.points)
  const showToast = useStore((s) => s.showToast)
  const [tier, setTier] = useState('all')
  const [modal, setModal] = useState(null)

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
      if (points < (item.points_cost || 0)) {
        showToast(`Need ${(item.points_cost - points).toLocaleString()} more XP`)
      } else {
        showToast('Earn this drop by predicting correctly')
      }
    }
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
                className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[390px] bg-surface-container-low border-t border-primary-container rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(216,207,188,0.15)]">
        <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
        <h2 className="font-h2 text-h2 text-primary-container text-center">{alreadyRedeemed ? 'CODE' : 'REDEEMED'}</h2>
        <p className="text-center text-on-surface-variant mb-4">{item.name}</p>
        <div className="bg-background border border-primary-container rounded-DEFAULT p-4 text-center font-mono text-h3 text-primary tracking-widest">
          {code || '—'}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 bg-primary-container text-background rounded-full font-label-caps text-label-caps">CLOSE</button>
      </motion.div>
    </motion.div>
  )
}
