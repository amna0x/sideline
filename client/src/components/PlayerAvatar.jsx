import { useState } from 'react'
import { getPlayerAvatar } from '../lib/players.js'
import { initialsFor, colorsFor } from '../lib/avatar.js'

export default function PlayerAvatar({ name, size = 32, className = '' }) {
  const [failed, setFailed] = useState(false)
  const url = getPlayerAvatar(name)
  const dim = { width: size, height: size }

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        style={dim}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  // Fallback to initials
  const { bg, fg } = colorsFor(name)
  const fontSize = Math.max(10, Math.round(size * 0.42))
  return (
    <span
      style={{ ...dim, background: bg, color: fg, fontSize }}
      className={`rounded-full inline-flex items-center justify-center font-semibold ${className}`}
      aria-label={name}
    >
      {initialsFor(name)}
    </span>
  )
}
