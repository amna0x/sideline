const PALETTE = [
  ['#13140f', '#d8cfbc'],
  ['#0a3d3a', '#9ad9c8'],
  ['#3a1f0a', '#e8c39a'],
  ['#1a0a3d', '#c8a9e8'],
  ['#3d0a1f', '#e8a9c8'],
  ['#0a1f3d', '#a9c8e8'],
  ['#1f3d0a', '#c8e8a9'],
  ['#3d3a0a', '#e8e0a9']
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function initialsFor(name) {
  if (!name) return '·'
  const parts = String(name).trim().split(/[\s_.-]+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function colorsFor(name) {
  const idx = hash(name || '·') % PALETTE.length
  const [bg, fg] = PALETTE[idx]
  return { bg, fg }
}
