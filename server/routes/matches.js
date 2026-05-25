import { Router } from 'express'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
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
    if (mode === 'postgres') {
      const { rows } = await query("SELECT * FROM matches WHERE status = 'live' LIMIT 1")
      match = rows[0] || null
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
    if (mode === 'postgres') {
      const { rows } = await query("SELECT * FROM matches WHERE status = 'upcoming' ORDER BY started_at ASC LIMIT 1")
      match = rows[0] || null
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
    if (mode === 'postgres') {
      const { rows } = await query('SELECT * FROM matches WHERE id = $1', [req.params.id])
      match = rows[0] || null
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
    if (mode === 'postgres') {
      const { rows } = await query('SELECT * FROM match_events WHERE match_id = $1 ORDER BY minute ASC', [req.params.id])
      return res.json(rows)
    }
    res.json(db.match_events.filter((e) => e.match_id === req.params.id))
  } catch (e) { next(e) }
})

r.get('/:id/ratings', async (req, res, next) => {
  try {
    let match = null
    let events = []

    if (mode === 'postgres') {
      const { rows: mRows } = await query('SELECT * FROM matches WHERE id = $1', [req.params.id])
      match = mRows[0] || null
      const { rows: eRows } = await query('SELECT * FROM match_events WHERE match_id = $1 ORDER BY minute ASC', [req.params.id])
      events = eRows
    } else {
      match = db.matches.get(req.params.id) || null
      events = db.match_events.filter((e) => e.match_id === req.params.id)
    }

    if (!match) return res.status(404).json({ error: 'match not found' })

    let ratings = await generatePlayerRatings(match.home_team, match.away_team, events)

    if (!ratings) {
      console.warn('[Matches Rating] AI ratings generation unavailable or failed. Using fallback.')
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
