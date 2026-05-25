import 'dotenv/config'
import { query } from './postgres.js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(__dirname, 'seed.json'), 'utf8'))

async function run() {
  console.log('Seeding matches...')
  for (const m of seed.matches) {
    await query(
      `INSERT INTO matches (id, home_team, away_team, home_score, away_score, minute, status, stadium, matchday, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.home_team, m.away_team, m.home_score, m.away_score, m.minute, m.status, m.stadium, m.matchday, m.started_at]
    )
    console.log('  ✓', m.id)
  }

  console.log('Seeding predictions...')
  for (const p of seed.predictions) {
    await query(
      `INSERT INTO predictions (id, match_id, type, question, options, opens_at, closes_at, correct_answer, resolved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.match_id, p.type, p.question, JSON.stringify(p.options), p.opens_at, p.closes_at, p.correct_answer, p.resolved_at]
    )
    console.log('  ✓', p.id)
  }

  console.log('Seeding vault items...')
  for (const v of seed.vault_items) {
    await query(
      `INSERT INTO vault_items (id, name, type, tier, total_supply, remaining_supply, image_url, points_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [v.id, v.name, v.type, v.tier, v.total_supply, v.remaining_supply, v.image_url, v.points_cost]
    )
    console.log('  ✓', v.id)
  }

  console.log('Done! All seed data in postgres.')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
