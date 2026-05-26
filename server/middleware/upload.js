import multer from 'multer'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { isAdmin } from '../routes/helpers.js'

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const STATIC_MIME = new Set(['image/jpeg', 'image/png'])
const GIF_MIME = 'image/gif'
const ALL_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
}

export function extForMime(mime) {
  return EXT_BY_MIME[mime] || 'bin'
}

async function hasGifUnlock(userId) {
  if (mode !== 'postgres' || !userId) return false
  const { rows } = await query(
    "SELECT id FROM user_cosmetics WHERE user_id = $1 AND cosmetic_id = 'gif_unlock'",
    [userId]
  )
  return rows.length > 0
}

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALL_MIME.has(file.mimetype)) return cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'unsupported_image_type'))
    cb(null, true)
  }
}).single('file')

class MulterError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
    this.status = 400
  }
}

export async function handleAvatarUpload(req, res, next) {
  avatarUpload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large', max_bytes: AVATAR_MAX_BYTES })
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(415).json({ error: err.message || 'unsupported_image_type' })
      return res.status(400).json({ error: 'upload_failed', detail: err.message })
    }
    if (!req.file) return next()

    // Check GIF permission (admins bypass)
    if (req.file.mimetype === GIF_MIME) {
      const userId = req.params.id || req.user?.id
      if (!isAdmin(req.user)) {
        const unlocked = await hasGifUnlock(userId)
        if (!unlocked) {
          return res.status(403).json({ error: 'gif_locked', message: 'Purchase "Animated Avatar" from the Vault to upload GIFs' })
        }
      }
    }

    // Reject non-PNG/JPG unless GIF is unlocked
    if (!STATIC_MIME.has(req.file.mimetype) && req.file.mimetype !== GIF_MIME) {
      return res.status(415).json({ error: 'unsupported_image_type', message: 'Only PNG and JPG are allowed' })
    }

    next()
  })
}
