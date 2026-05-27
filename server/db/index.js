// Unified data access layer.
// Priority: PostgreSQL (AWS RDS) → In-memory fallback.
//
// Routes import from here instead of directly from postgres.js or memory.js.

import { ready as pgReady, query } from './postgres.js'
import { db as mem } from './memory.js'

export const mode = pgReady ? 'postgres' : 'memory'

console.log(`[db] running in "${mode}" mode`)

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUser(id) {
  if (mode === 'postgres') {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id])
    return rows[0] || null
  }
  return mem.users.get(id) || null
}

export async function createUser(user) {
  if (mode === 'postgres') {
    const { rows } = await query(
      `INSERT INTO users (id, username, email, avatar_url, tier, points_total, predictions_made, predictions_correct, matches_watched, prediction_title)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [user.id, user.username, user.email || null, user.avatar_url || null,
       user.tier || 'fan', user.points_total || 0, user.predictions_made || 0,
       user.predictions_correct || 0, user.matches_watched || 0, user.prediction_title || 'Rookie']
    )
    return rows[0] || (await getUser(user.id))
  }
  mem.users.set(user.id, user)
  return user
}

export async function updateUser(id, patch) {
  if (mode === 'postgres') {
    const keys = Object.keys(patch)
    if (keys.length === 0) return getUser(id)
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
    const { rows } = await query(
      `UPDATE users SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(patch)]
    )
    return rows[0]
  }
  const u = mem.users.get(id)
  if (!u) return null
  Object.assign(u, patch)
  return u
}

export async function deleteUser(id) {
  if (mode === 'postgres') {
    await query('DELETE FROM users WHERE id = $1', [id])
    return
  }
  mem.users.delete(id)
}

// ─── User Vault ──────────────────────────────────────────────────────────────

export async function getUserVault(userId) {
  if (mode === 'postgres') {
    const { rows } = await query(
      `SELECT uv.*, vi.name, vi.type, vi.tier, vi.image_url, vi.points_cost
       FROM user_vault uv JOIN vault_items vi ON vi.id = uv.vault_item_id
       WHERE uv.user_id = $1`, [userId]
    )
    return rows
  }
  const ownedRows = mem.user_vault.filter((v) => v.user_id === userId)
  return ownedRows.map((row) => ({ ...mem.vault_items.get(row.vault_item_id), ...row }))
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export async function getActivePredictions(matchId) {
  const now = new Date().toISOString()
  if (mode === 'postgres') {
    const { rows } = await query(
      `SELECT * FROM predictions
       WHERE match_id = $1 AND resolved_at IS NULL
         AND opens_at <= $2 AND closes_at > $2
       ORDER BY opens_at`, [matchId, now]
    )
    // Also include memory-only predictions from simulator
    const memPreds = [...mem.predictions.values()].filter((p) =>
      p.match_id === matchId && !p.resolved_at &&
      new Date(p.opens_at) <= new Date() && new Date(p.closes_at) > new Date() &&
      !rows.find((r) => r.id === p.id)
    )
    return [...rows, ...memPreds]
  }
  return [...mem.predictions.values()].filter((p) =>
    p.match_id === matchId && !p.resolved_at &&
    new Date(p.opens_at) <= new Date() && new Date(p.closes_at) > new Date()
  )
}

export async function getUpcomingPredictions(matchId, limit = 2) {
  const now = new Date().toISOString()
  if (mode === 'postgres') {
    const { rows } = await query(
      `SELECT * FROM predictions
       WHERE match_id = $1 AND opens_at > $2
       ORDER BY opens_at LIMIT $3`, [matchId, now, limit]
    )
    return rows
  }
  return [...mem.predictions.values()]
    .filter((p) => p.match_id === matchId && p.opens_at && new Date(p.opens_at) > new Date())
    .sort((a, b) => new Date(a.opens_at) - new Date(b.opens_at))
    .slice(0, limit)
}

export async function getPrediction(id) {
  if (mode === 'postgres') {
    const { rows } = await query('SELECT * FROM predictions WHERE id = $1', [id])
    if (rows[0]) return rows[0]
    return mem.predictions.get(id) || null
  }
  return mem.predictions.get(id) || null
}

export async function submitPrediction(record) {
  if (mode === 'postgres') {
    const { rows: existingRows } = await query(
      'SELECT id FROM user_predictions WHERE user_id = $1 AND prediction_id = $2 LIMIT 1',
      [record.user_id, record.prediction_id]
    )
    if (existingRows[0]) {
      const { rows } = await query(
        `UPDATE user_predictions
         SET selected_option = $3,
             speed_ms = $4,
             speed_bonus = $5,
             submitted_at = $6
         WHERE user_id = $1 AND prediction_id = $2
         RETURNING *`,
        [record.user_id, record.prediction_id, record.selected_option,
         record.speed_ms, record.speed_bonus, record.submitted_at]
      )
      return { submission: rows[0], created: false }
    }
    const { rows } = await query(
      `INSERT INTO user_predictions (user_id, prediction_id, selected_option, speed_ms, speed_bonus, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [record.user_id, record.prediction_id, record.selected_option,
       record.speed_ms, record.speed_bonus, record.submitted_at]
    )
    return { submission: rows[0], created: true }
  }
  const existing = mem.user_predictions.find(
    (u) => u.user_id === record.user_id && u.prediction_id === record.prediction_id
  )
  if (existing) {
    existing.selected_option = record.selected_option
    existing.speed_ms = record.speed_ms
    existing.speed_bonus = record.speed_bonus
    existing.submitted_at = record.submitted_at
    return { submission: existing, created: false }
  }
  mem.user_predictions.push(record)
  return { submission: record, created: true }
}

export async function hasUserSubmitted(userId, predictionId) {
  if (mode === 'postgres') {
    const { rows } = await query(
      'SELECT 1 FROM user_predictions WHERE user_id = $1 AND prediction_id = $2',
      [userId, predictionId]
    )
    return rows.length > 0
  }
  return mem.user_predictions.some(
    (u) => u.user_id === userId && u.prediction_id === predictionId
  )
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(scope, matchId, limit = 20) {
  if (mode === 'postgres') {
    if (scope === 'match' && matchId) {
      const { rows } = await query(
        `SELECT up.user_id, u.username, u.tier, u.avatar_url, COALESCE(SUM(up.points_earned), 0)::int as points_total
         FROM user_predictions up
         JOIN predictions p ON p.id = up.prediction_id
         JOIN users u ON u.id = up.user_id
         WHERE p.match_id = $1
         GROUP BY up.user_id, u.username, u.tier, u.avatar_url
         ORDER BY points_total DESC LIMIT $2`, [matchId, limit]
      )
      return rows
    }
    if (scope === 'month') {
      const { rows } = await query(
        `SELECT up.user_id, u.username, u.tier, u.avatar_url, COALESCE(SUM(up.points_earned), 0)::int as points_total
         FROM user_predictions up
         JOIN users u ON u.id = up.user_id
         WHERE up.submitted_at >= date_trunc('month', NOW())
         GROUP BY up.user_id, u.username, u.tier, u.avatar_url
         ORDER BY points_total DESC LIMIT $1`, [limit]
      )
      return rows
    }
    const { rows } = await query(
      `SELECT id as user_id, username, tier, avatar_url, points_total
       FROM users ORDER BY points_total DESC LIMIT $1`, [limit]
    )
    return rows
  }
  return memoryLeaderboard(scope, matchId, limit)
}

export async function getUserRank(userId, scope) {
  if (mode === 'postgres') {
    if (scope === 'all') {
      const { rows } = await query(
        `SELECT user_id, points_total, rank FROM (
           SELECT id as user_id, points_total, RANK() OVER (ORDER BY points_total DESC) as rank
           FROM users
         ) ranked WHERE user_id = $1`, [userId]
      )
      if (!rows[0]) return { rank: null, points_total: 0, to_next: 0 }
      const rank = Number(rows[0].rank)
      const pts = Number(rows[0].points_total)
      const { rows: above } = await query(
        'SELECT points_total FROM users WHERE points_total > $1 ORDER BY points_total ASC LIMIT 1', [pts]
      )
      return { rank, points_total: pts, to_next: above[0] ? above[0].points_total - pts : 0 }
    }
    const all = await getLeaderboard(scope, null, 1000)
    const idx = all.findIndex((r) => r.user_id === userId)
    if (idx < 0) return { rank: null, points_total: 0, to_next: 0 }
    return { rank: idx + 1, points_total: Number(all[idx].points_total), to_next: idx > 0 ? Number(all[idx - 1].points_total) - Number(all[idx].points_total) : 0 }
  }
  const all = memoryLeaderboard(scope)
  const idx = all.findIndex((r) => r.user_id === userId)
  if (idx < 0) return { rank: null, points_total: 0, to_next: 0 }
  return { rank: idx + 1, points_total: all[idx].points_total, to_next: idx > 0 ? all[idx - 1].points_total - all[idx].points_total : 0 }
}

// ─── Vault ───────────────────────────────────────────────────────────────────

export async function getVaultItems() {
  if (mode === 'postgres') {
    const { rows } = await query('SELECT * FROM vault_items ORDER BY points_cost ASC')
    return rows
  }
  return [...mem.vault_items.values()]
}

export async function redeemVaultItem(userId, itemId) {
  if (mode === 'postgres') {
    const { rows: items } = await query('SELECT * FROM vault_items WHERE id = $1', [itemId])
    if (!items[0]) throw Object.assign(new Error('item not found'), { status: 404 })
    if (items[0].remaining_supply <= 0) throw Object.assign(new Error('out of stock'), { status: 400 })
    await query('UPDATE vault_items SET remaining_supply = remaining_supply - 1 WHERE id = $1', [itemId])
    const { rows } = await query(
      'INSERT INTO user_vault (user_id, vault_item_id, earned_at) VALUES ($1, $2, NOW()) RETURNING *',
      [userId, itemId]
    )
    return rows[0]
  }
  const item = mem.vault_items.get(itemId)
  if (!item) throw Object.assign(new Error('item not found'), { status: 404 })
  if (item.remaining_supply <= 0) throw Object.assign(new Error('out of stock'), { status: 400 })
  item.remaining_supply -= 1
  const record = { id: `uv_${Date.now()}`, user_id: userId, vault_item_id: itemId, earned_at: new Date().toISOString(), redeemed: false }
  mem.user_vault.push(record)
  return record
}

// ─── Match History ───────────────────────────────────────────────────────────

export async function getUserMatchHistory(userId, limit = 10) {
  if (mode === 'postgres') {
    const { rows } = await query(
      `SELECT m.id, m.home_team, m.away_team, m.matchday,
              COUNT(*)::int as predictions_made,
              COUNT(*) FILTER (WHERE up.is_correct)::int as predictions_correct,
              COALESCE(SUM(up.points_earned), 0)::int as points_earned
       FROM user_predictions up
       JOIN predictions p ON p.id = up.prediction_id
       JOIN matches m ON m.id = p.match_id
       WHERE up.user_id = $1
       GROUP BY m.id, m.home_team, m.away_team, m.matchday
       ORDER BY MAX(up.submitted_at) DESC
       LIMIT $2`, [userId, limit]
    )
    return rows
  }
  const rows = mem.user_predictions.filter((u) => u.user_id === userId)
  const byMatch = new Map()
  for (const row of rows) {
    const pred = mem.predictions.get(row.prediction_id)
    if (!pred) continue
    const m = mem.matches.get(pred.match_id)
    if (!m) continue
    const cur = byMatch.get(m.id) || { id: m.id, home_team: m.home_team, away_team: m.away_team, matchday: m.matchday, predictions_made: 0, predictions_correct: 0, points_earned: 0 }
    cur.predictions_made += 1
    if (row.is_correct) cur.predictions_correct += 1
    cur.points_earned += row.points_earned || 0
    byMatch.set(m.id, cur)
  }
  return [...byMatch.values()].slice(0, limit)
}

// ─── Memory leaderboard helper ───────────────────────────────────────────────

function memoryLeaderboard(scope, matchId, limit = 20) {
  const totals = new Map()
  for (const sub of mem.user_predictions) {
    if (scope === 'match' && matchId) {
      const pred = mem.predictions.get(sub.prediction_id)
      if (!pred || pred.match_id !== matchId) continue
    }
    if (scope === 'month') {
      const ts = new Date(sub.submitted_at)
      const now = new Date()
      if (ts.getMonth() !== now.getMonth() || ts.getFullYear() !== now.getFullYear()) continue
    }
    const cur = totals.get(sub.user_id) || 0
    totals.set(sub.user_id, cur + (sub.points_earned || 0))
  }
  return [...totals.entries()].map(([user_id, points_total]) => {
    const u = mem.users.get(user_id) || { username: user_id.slice(0, 8), tier: 'fan' }
    return { user_id, points_total, username: u.username, tier: u.tier, avatar_url: u.avatar_url }
  }).sort((a, b) => b.points_total - a.points_total).slice(0, limit)
}
