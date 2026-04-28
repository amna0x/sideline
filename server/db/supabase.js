import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.warn('[supabase] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — running with in-memory fallback')
}

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null

export const ready = !!supabase
