// Seed the RDS PostgreSQL database with data from seed.json.
// Run: node --env-file=.env db/seed-rds.js

import pg from 'pg'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(__dirname, 'seed.json'), 'utf8'))

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  for (const m of seed.matches) {
    await pool.query(
      `INSERT INTO matches (id, home_team, away_team, home_score, away_score, minute, status, stadium, matchday, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.home_team, m.away_team, m.home_score, m.away_score, m.minute, m.status, m.stadium, m.matchday, m.started_at]
    )
  }
  console.log(`[seed] matches: ${seed.matches.length}`)

  for (const v of seed.vault_items) {
    await pool.query(
      `INSERT INTO vault_items (id, name, type, tier, total_supply, remaining_supply, image_url, points_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [v.id, v.name, v.type, v.tier, v.total_supply, v.remaining_supply, v.image_url, v.points_cost]
    )
  }
  console.log(`[seed] vault_items: ${seed.vault_items.length}`)

  for (const p of seed.predictions) {
    await pool.query(
      `INSERT INTO predictions (id, match_id, type, question, options, correct_answer, opens_at, closes_at, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [p.id, p.match_id, p.type, p.question, JSON.stringify(p.options), p.correct_answer, p.opens_at, p.closes_at, p.resolved_at]
    )
  }
  console.log(`[seed] predictions: ${seed.predictions.length}`)

  for (const q of seed.quiz_questions) {
    await pool.query(
      `INSERT INTO quiz_questions (id, match_id, question, options, correct_answer, fun_fact, difficulty)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [q.id, q.match_id, q.question, JSON.stringify(q.options), q.correct_answer, q.fun_fact, q.difficulty]
    )
  }
  console.log(`[seed] quiz_questions: ${seed.quiz_questions.length}`)

  await pool.end()
  console.log('[seed] done')
}

run().catch((e) => { console.error('[seed] error:', e.message); pool.end(); process.exit(1) })
