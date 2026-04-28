// Seed Supabase from seed.json. Requires SUPABASE_SERVICE_ROLE_KEY.
// Run: `npm --prefix server run seed`

import 'dotenv/config'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { supabase, ready } from './supabase.js'

if (!ready) {
  console.error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required to seed')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(__dirname, 'seed.json'), 'utf8'))

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows)
  if (error) throw new Error(`${table}: ${error.message}`)
  console.log(`✓ ${table} (${rows.length})`)
}

await upsert('matches', seed.matches)
await upsert('predictions', seed.predictions)
await upsert('vault_items', seed.vault_items)
await upsert('quiz_questions', seed.quiz_questions)
console.log('Seed complete.')
