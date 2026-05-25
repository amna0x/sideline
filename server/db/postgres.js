// Direct PostgreSQL connection via node-postgres (pg).
// Used when DB_HOST is configured (AWS RDS). Falls through to
// in-memory when absent.

import pg from 'pg'

const { Pool } = pg

const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD

export const pgReady = !!(DB_HOST && DB_NAME && DB_USER && DB_PASSWORD)
export const ready = pgReady

export const pool = pgReady
  ? new Pool({
      host: DB_HOST,
      port: Number(DB_PORT),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000
    })
  : null

if (pgReady) {
  pool.on('error', (err) => console.error('[postgres] pool error:', err.message))
  console.log(`[postgres] pool ready (${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME})`)
} else {
  console.warn('[postgres] DB_HOST/DB_NAME/DB_USER/DB_PASSWORD not set — Postgres unavailable')
}

// Convenience query helper
export async function query(text, params) {
  if (!pool) throw new Error('Postgres not configured')
  return pool.query(text, params)
}
