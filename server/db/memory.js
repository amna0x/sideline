// In-memory fallback so the API works without Supabase configured.
// Replaced by real DB once SUPABASE_* env vars are set.

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(__dirname, 'seed.json'), 'utf8'))

export const db = {
  users: new Map(),
  matches: new Map(seed.matches.map((m) => [m.id, { ...m }])),
  predictions: new Map(seed.predictions.map((p) => [p.id, { ...p }])),
  user_predictions: [],
  vault_items: new Map(seed.vault_items.map((v) => [v.id, { ...v }])),
  user_vault: [],
  match_events: [],
  quiz_questions: new Map(seed.quiz_questions.map((q) => [q.id, { ...q }]))
}

export function pickLiveMatch() {
  for (const m of db.matches.values()) if (m.status === 'live') return m
  return null
}

export function pickUpcomingMatch() {
  const list = [...db.matches.values()].filter((m) => m.status === 'upcoming')
  return list.sort((a, b) => new Date(a.started_at) - new Date(b.started_at))[0] || null
}
