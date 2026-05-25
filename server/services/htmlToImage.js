// Server-side shareable card renderer.
// Default provider: htmlcsstoimage.com (https://docs.htmlcsstoimage.com/).
// Configure via HCTI_USER_ID + HCTI_API_KEY env vars. Returns null when missing
// so the client can fall back to its in-browser canvas generator.

const HCTI_USER_ID = process.env.HCTI_USER_ID
const HCTI_API_KEY = process.env.HCTI_API_KEY
const HCTI_ENDPOINT = 'https://hcti.io/v1/image'

export const htmlToImageReady = !!(HCTI_USER_ID && HCTI_API_KEY)

if (!htmlToImageReady) {
  console.warn('[htmlToImage] HCTI_USER_ID / HCTI_API_KEY not set — share-card route will return 503 until configured')
}

export async function renderCard({ html, css, viewport_width = 1080, viewport_height = 1440, device_scale = 2 }) {
  if (!htmlToImageReady) return null

  const auth = Buffer.from(`${HCTI_USER_ID}:${HCTI_API_KEY}`).toString('base64')
  const body = JSON.stringify({ html, css, viewport_width, viewport_height, device_scale, ms_delay: 200 })

  const res = await fetch(HCTI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`
    },
    body
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`hcti ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  return json.url || null
}

// Build the Adidas drop card HTML/CSS. Mirrors the look of client/src/lib/canvas.js
// so a hosted image lines up with the in-app preview.
export function buildDropCardMarkup({
  player = 'Unknown',
  minute = 0,
  team = '',
  username = 'guest',
  accuracy = 0,
  rarity = 'EPIC',
  isRare = false
}) {
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const html = `
    <div class="card">
      <div class="hud">
        <span class="dot"></span>
        <span class="rarity">${escape(rarity)} DROP &middot; ${escape(team)}</span>
      </div>
      <div class="player">${escape(player.toUpperCase())}</div>
      <div class="minute">${Number(minute) || 0}'</div>
      <div class="goal">GOAL &middot; MATCH MOMENT</div>
      <div class="footer">
        <div>
          <div class="captured">CAPTURED BY</div>
          <div class="username">@${escape(username)}</div>
          <div class="accuracy">Prediction accuracy: ${Number(accuracy) || 0}%</div>
        </div>
        <div class="brand">SIDELINE &times; adidas</div>
      </div>
      ${isRare ? '<div class="mythic">1 OF 10 &middot; MYTHIC</div>' : ''}
    </div>
  `
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');
    body { margin: 0; padding: 0; }
    .card {
      width: 1080px; height: 1440px; box-sizing: border-box;
      padding: 80px; position: relative;
      background: linear-gradient(135deg, #1b1c17 0%, #0e0f0a 100%);
      color: #f5ebd7; font-family: 'Space Grotesk', sans-serif;
      border: 6px solid #565449;
    }
    .hud { display: flex; align-items: center; gap: 16px; font-size: 32px; font-weight: 700; color: #d8cfbc; letter-spacing: 0.05em; }
    .hud .dot { width: 60px; height: 4px; background: #d8cfbc; }
    .player { font-size: 200px; font-weight: 700; line-height: 1; margin-top: 360px; word-break: break-word; }
    .minute { font-size: 320px; font-weight: 700; color: #d8cfbc; opacity: 0.4; line-height: 1; margin-top: 40px; }
    .goal { font-size: 60px; font-weight: 700; color: #FFFBF4; margin-top: 20px; letter-spacing: 0.05em; }
    .footer {
      position: absolute; left: 80px; right: 80px; bottom: 100px;
      background: #1f201b; border: 2px solid #d8cfbc; padding: 40px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .captured { font-size: 36px; font-weight: 700; color: #d8cfbc; letter-spacing: 0.1em; }
    .username { font-size: 64px; font-weight: 700; color: #f5ebd7; margin-top: 4px; }
    .accuracy { font-size: 36px; color: #cac6b9; margin-top: 12px; }
    .brand { font-size: 44px; font-weight: 700; color: #FFFBF4; }
    .mythic {
      position: absolute; top: 80px; right: 80px;
      background: #FFD6A5; color: #1b1c17;
      font-size: 28px; font-weight: 700; letter-spacing: 0.1em;
      padding: 12px 20px;
    }
  `
  return { html, css }
}
