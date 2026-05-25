// PostgreSQL connection via pg (node-postgres).
// Used when DB_HOST is set in .env. Falls back to memory.js otherwise.

import pg from 'pg'
const { Pool } = pg

const host = process.env.DB_HOST
const port = process.env.DB_PORT || 5432
const database = process.env.DB_NAME || 'sideline'
const user = process.env.DB_USER || 'sideline_app'
const password = process.env.DB_PASSWORD

export const ready = !!(host && password)

let pool = null

if (ready) {
  pool = new Pool({
    host,
    port: Number(port),
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000
  })

  pool.on('error', (err) => {
    console.error('[postgres] unexpected pool error:', err.message)
  })

  // Test connection on startup
  pool.query('SELECT NOW()')
    .then(() => console.log('[postgres] connected to', host))
    .catch((err) => console.error('[postgres] connection failed:', err.message))
}

export { pool }

export async function query(text, params) {
  if (!pool) throw new Error('postgres not configured')
  return pool.query(text, params)
}
