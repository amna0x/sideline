import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/index.js'
import { generateDropCard, shareDropCard } from '../lib/canvas.js'
import { api } from '../lib/api.js'

export default function AdidasDropOverlay() {
  const drop = useStore((s) => s.pendingDrop)
  const setDrop = useStore((s) => s.setPendingDrop)
  const user = useStore((s) => s.user)
  const showToast = useStore((s) => s.showToast)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [hostedUrl, setHostedUrl] = useState(null)
  const blobRef = useRef(null)

  useEffect(() => {
    if (!drop) { setPreviewUrl(null); setHostedUrl(null); blobRef.current = null; return }
    const accuracy = user?.profile?.predictions_made
      ? Math.round((user.profile.predictions_correct / user.profile.predictions_made) * 100)
      : 0
    const payload = {
      player: drop.player_name || 'Unknown',
      minute: drop.minute || 0,
      team: drop.team || '',
      username: user?.profile?.username || 'guest',
      accuracy,
      rarity: drop.rarity || 'EPIC',
      isRare: !!drop.is_rare
    }
    generateDropCard(payload).then((blob) => {
      blobRef.current = blob
      setPreviewUrl(URL.createObjectURL(blob))
    })
    api.shareCard({
      player: payload.player,
      minute: payload.minute,
      team: payload.team,
      username: payload.username,
      accuracy: payload.accuracy,
      rarity: payload.rarity,
      is_rare: payload.isRare
    }).then((r) => { if (r?.url) setHostedUrl(r.url) }).catch(() => {})
  }, [drop, user])

  if (!drop) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 flex items-end justify-center"
        onClick={() => setDrop(null)}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26 }}
          drag="y" dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => { if (info.offset.y > 80) setDrop(null) }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[390px] bg-surface-container-low border-t border-primary-container rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(216,207,188,0.2)] max-h-[88dvh] overflow-y-auto"
        >
          <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_rgba(216,207,188,0.8)]" />
              <span className="font-label-caps text-label-caps text-on-background">{drop.is_rare ? '1 OF 10 — MYTHIC DROP' : `${drop.rarity || 'EPIC'} DROP`}</span>
            </div>
            <button onClick={() => setDrop(null)} className="w-8 h-8 rounded-full border border-outline flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
            </button>
          </div>

          <div className="rounded-2xl border border-outline overflow-hidden bg-background">
            {previewUrl
              ? <img src={previewUrl} alt="Drop card" className="w-full" />
              : <div className="aspect-[3/4] flex items-center justify-center text-outline">Generating…</div>}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button onClick={async () => {
              const text = `GOAL ${drop.player_name} ${drop.minute}'`
              if (hostedUrl) {
                try {
                  if (navigator.share) await navigator.share({ url: hostedUrl, text, title: 'Sideline Drop Moment' })
                  else await navigator.clipboard.writeText(hostedUrl)
                  showToast('Shared')
                  return
                } catch { /* fall through to blob */ }
              }
              if (!blobRef.current) return
              const ok = await shareDropCard(blobRef.current, text)
              if (ok) showToast('Shared / copied to clipboard')
            }} className="w-full py-3 bg-primary-container text-background font-label-caps text-label-caps rounded-full shadow-[0_0_20px_rgba(216,207,188,0.2)] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined fill-icon">share</span> SHARE DROP
            </button>
            <button onClick={() => setDrop(null)} className="w-full py-3 bg-transparent border border-outline text-primary-container rounded-full font-label-caps text-label-caps">
              VIEW IN VAULT LATER
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
