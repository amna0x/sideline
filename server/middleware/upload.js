import multer from 'multer'

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
}

export function extForMime(mime) {
  return EXT_BY_MIME[mime] || 'bin'
}

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!AVATAR_MIME.has(file.mimetype)) return cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'unsupported_image_type'))
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

export function handleAvatarUpload(req, res, next) {
  avatarUpload(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large', max_bytes: AVATAR_MAX_BYTES })
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(415).json({ error: err.message || 'unsupported_image_type' })
    return res.status(400).json({ error: 'upload_failed', detail: err.message })
  })
}
