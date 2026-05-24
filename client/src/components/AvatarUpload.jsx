import { useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import { api } from '../lib/api.js'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function AvatarUpload({ userId, currentUrl, name, size = 112, onUploaded, onError }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(null)

  async function onPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !userId) return
    if (!ALLOWED.includes(file.type)) return onError?.('Unsupported image type. Use JPG, PNG, WebP, or GIF.')
    if (file.size > MAX_BYTES) return onError?.(`File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB).`)

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setBusy(true)
    try {
      const { avatar_url } = await api.uploadAvatar(userId, file)
      onUploaded?.(avatar_url)
    } catch (err) {
      onError?.(err.message || 'Upload failed')
    } finally {
      setBusy(false)
      URL.revokeObjectURL(localPreview)
      setPreview(null)
    }
  }

  const url = preview || currentUrl

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <div className="absolute -inset-1 bg-primary-container/30 rounded-full blur-md animate-pulse" />
      <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary-container z-10 bg-surface-container-low shadow-[0_0_20px_rgba(216,207,188,0.2)]">
        <Avatar url={url} name={name} size={size} />
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        aria-label="Change avatar"
        className="absolute bottom-0 right-0 w-8 h-8 bg-primary-container text-background rounded-full flex items-center justify-center shadow-md disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[16px]">{busy ? 'progress_activity' : 'edit'}</span>
      </button>
      <input ref={fileRef} type="file" accept={ALLOWED.join(',')} onChange={onPick} className="hidden" />
    </div>
  )
}
