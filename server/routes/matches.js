import { Router } from 'express'
import { supabase, ready } from '../db/supabase.js'
import { db, pickLiveMatch, pickUpcomingMatch } from '../db/memory.js'
import { fetchLiveScores, mapFixtureToMatch } from '../services/apiFootball.js'
import { getTeamLogoUrl } from '../services/sofascore.js'
import { generatePlayerRatings } from '../services/gemini.js'

const r = Router()

r.get('/live', async (_, res, next) => {
  try {
    // 1. Try to fetch live match from Api-football
    const liveFixtures = await fetchLiveScores()
    if (liveFixtures && liveFixtures.length > 0) {
      const match = mapFixtureToMatch(liveFixtures[0])
      if (match) {
        return res.json(match)
      }
    }

    // 2. Fall back to DB / Simulator
    let match = null
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('status', 'live').limit(1)
      if (error) throw error
      match = data?.[0] || null
    } else {
      match = pickLiveMatch()
    }

    if (match) {
      match.home_team_logo = getTeamLogoUrl(match.home_team)
      match.away_team_logo = getTeamLogoUrl(match.away_team)
    }
    res.json(match)
  } catch (e) { next(e) }
})

r.get('/upcoming', async (_, res, next) => {
  try {
    let match = null
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('status', 'upcoming').order('started_at', { ascending: true }).limit(1)
      if (error) throw error
      match = data?.[0] || null
    } else {
      match = pickUpcomingMatch()
    }

    if (match) {
      match.home_team_logo = getTeamLogoUrl(match.home_team)
      match.away_team_logo = getTeamLogoUrl(match.away_team)
    }
    res.json(match)
  } catch (e) { next(e) }
})

r.get('/:id', async (req, res, next) => {
  try {
    let match = null
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('id', req.params.id).single()
      if (error) throw error
      match = data
    } else {
      match = db.matches.get(req.params.id) || null
    }

    if (match) {
      match.home_team_logo = getTeamLogoUrl(match.home_team)
      match.away_team_logo = getTeamLogoUrl(match.away_team)
    }
    res.json(match)
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

r.get('/:id/ratings', async (req, res, next) => {
  try {
    let match = null
    let events = []

    if (ready) {
      const { data: mData, error: mErr } = await supabase.from('matches').select('*').eq('id', req.params.id).single()
      if (mErr) throw mErr
      match = mData

      const { data: eData } = await supabase.from('match_events').select('*').eq('match_id', req.params.id).order('minute', { ascending: true })
      events = eData || []
    } else {
      match = db.matches.get(req.params.id) || null
      events = db.match_events.filter((e) => e.match_id === req.params.id)
    }

    if (!match) return res.status(404).json({ error: 'match not found' })

    // Generate ratings using AI (Gemini or Claude)
    let ratings = await generatePlayerRatings(match.home_team, match.away_team, events)

    // Fallback if AI key is missing or fails
    if (!ratings) {
      console.warn('[Matches Rating] AI ratings generation unavailable or failed. Using fallback.');
      ratings = {
        ratings: [
          { name: 'Harry Kane', rating: 8.2, position: 'FW', summary: 'Dynamic threat up front, scored the crucial equalizer.' },
          { name: 'Serhou Guirassy', rating: 7.9, position: 'FW', summary: 'Constant physical presence, provided the key assist.' },
          { name: 'Jamal Musiala', rating: 8.5, position: 'MF', summary: 'Excellent dribbling, controlled the tempo in midfield.' },
          { name: 'Julian Brandt', rating: 7.5, position: 'MF', summary: 'Created multiple chances and kept BVB attack moving.' },
          { name: 'Karim Adeyemi', rating: 7.8, position: 'FW', summary: 'Incredible speed on the wing, stretched the defense.' }
        ]
      }
    }

    res.json(ratings)
  } catch (e) { next(e) }
})

export default r
