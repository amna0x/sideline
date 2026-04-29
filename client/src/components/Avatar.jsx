import { initialsFor, colorsFor } from '../lib/avatar.js'

export default function Avatar({ url, name, size = 32, className = '', alt = '' }) {
  const dim = { width: size, height: size }
  const fontSize = Math.max(10, Math.round(size * 0.42))
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={dim}
        className={`rounded-full object-cover bg-surface-container ${className}`}
      />
    )
  }
  const { bg, fg } = colorsFor(name)
  return (
    <span
      style={{ ...dim, background: bg, color: fg, fontSize }}
      className={`rounded-full inline-flex items-center justify-center font-semibold tracking-tight select-none ${className}`}
      aria-label={alt || name}
    >
      {initialsFor(name)}
    </span>
  )
}
