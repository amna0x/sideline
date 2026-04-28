import { Router } from 'express'
import { supabase, ready } from '../db/supabase.js'
import { db, pickLiveMatch, pickUpcomingMatch } from '../db/memory.js'

const r = Router()

r.get('/live', async (_, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('status', 'live').limit(1)
      if (error) throw error
      return res.json(data?.[0] || null)
    }
    res.json(pickLiveMatch())
  } catch (e) { next(e) }
})

r.get('/upcoming', async (_, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('status', 'upcoming').order('started_at', { ascending: true }).limit(1)
      if (error) throw error
      return res.json(data?.[0] || null)
    }
    res.json(pickUpcomingMatch())
  } catch (e) { next(e) }
})

r.get('/:id', async (req, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('id', req.params.id).single()
      if (error) throw error
      return res.json(data)
    }
    res.json(db.matches.get(req.params.id) || null)
  } catch (e) { next(e) }
})

r.get('/:id/events', async (req, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('match_events').select('*').eq('match_id', req.params.id).order('minute', { ascending: true })
      if (error) throw error
      return res.json(data)
    }
    res.json(db.match_events.filter((e) => e.match_id === req.params.id))
  } catch (e) { next(e) }
})

export default r
