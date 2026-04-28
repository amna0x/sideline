// Generate Adidas Drop Moment shareable card via HTML Canvas.
// Returns Blob (PNG) on success.

export async function generateDropCard({
  player, minute, team, username, accuracy, rarity = 'EPIC', isRare = false
}) {
  const W = 1080, H = 1440
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // background
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#1b1c17')
  grad.addColorStop(1, '#0e0f0a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // adidas-style geometric shapes
  ctx.fillStyle = '#d8cfbc'
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(W * 0.15 * i, H)
    ctx.lineTo(W * 0.15 * i + 200, H - 600 - i * 40)
    ctx.lineTo(W * 0.15 * i + 240, H - 600 - i * 40)
    ctx.lineTo(W * 0.15 * i + 40, H)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // border
  ctx.strokeStyle = '#565449'
  ctx.lineWidth = 6
  ctx.strokeRect(40, 40, W - 80, H - 80)

  // top HUD line + rarity badge
  ctx.fillStyle = isRare ? '#FFD6A5' : '#d8cfbc'
  ctx.fillRect(80, 120, 60, 4)
  ctx.font = 'bold 32px "Space Grotesk", sans-serif'
  ctx.fillStyle = '#d8cfbc'
  ctx.fillText(`${rarity} DROP · ${team}`.toUpperCase(), 160, 138)

  // player name
  ctx.fillStyle = '#f5ebd7'
  ctx.font = 'bold 200px "Space Grotesk", sans-serif'
  ctx.fillText(player.toUpperCase(), 80, 600)

  // minute big
  ctx.fillStyle = '#d8cfbc'
  ctx.font = 'bold 320px "Space Grotesk", sans-serif'
  ctx.globalAlpha = 0.4
  ctx.fillText(`${minute}'`, 80, 920)
  ctx.globalAlpha = 1

  // GOAL label
  ctx.fillStyle = '#FFFBF4'
  ctx.font = 'bold 60px "Space Grotesk", sans-serif'
  ctx.fillText('GOAL · MATCH MOMENT', 80, 1000)

  // user info bar
  ctx.fillStyle = '#1f201b'
  ctx.fillRect(80, H - 280, W - 160, 180)
  ctx.strokeStyle = '#d8cfbc'
  ctx.lineWidth = 2
  ctx.strokeRect(80, H - 280, W - 160, 180)
  ctx.fillStyle = '#d8cfbc'
  ctx.font = 'bold 36px "Space Grotesk", sans-serif'
  ctx.fillText('CAPTURED BY', 120, H - 220)
  ctx.fillStyle = '#f5ebd7'
  ctx.font = 'bold 64px "Space Grotesk", sans-serif'
  ctx.fillText(`@${username}`, 120, H - 160)
  ctx.fillStyle = '#cac6b9'
  ctx.font = '36px "Space Grotesk", sans-serif'
  ctx.fillText(`Prediction accuracy: ${accuracy}%`, 120, H - 110)

  // adidas wordmark
  ctx.fillStyle = '#FFFBF4'
  ctx.font = 'bold 44px "Space Grotesk", sans-serif'
  ctx.fillText('SIDELINE × adidas', W - 540, H - 110)

  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92))
}

export async function shareDropCard(blob, text) {
  const file = new File([blob], 'sideline-drop.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: 'Sideline Drop Moment' }); return true } catch { /* user cancelled */ }
  }
  // fallback: copy URL to clipboard
  try {
    const url = URL.createObjectURL(blob)
    await navigator.clipboard.writeText(url)
    return true
  } catch { return false }
}
