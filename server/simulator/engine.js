// Match simulator — replays a JSON timeline and emits Socket.io events.
// Call startSimulator(io) from the server, or run via `npm run simulate`.

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/memory.js'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { emit } from '../socket/handlers.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function startSimulator(io, opts = {}) {
  const file = opts.file || join(__dirname, 'match_demo.json')
  const speed = opts.speed || 30 // 30x realtime → a 90' match plays in 3 minutes
  const timeline = JSON.parse(readFileSync(file, 'utf8'))
  console.log(`[sim] starting ${timeline.match.home_team} vs ${timeline.match.away_team} @${speed}x`)

  let match = { ...timeline.match, status: 'live', minute: 0, home_score: 0, away_score: 0 }
  upsertMatch(match)
  emit.matchUpdate(io, match.id, match)

  const events = [...timeline.events].sort((a, b) => a.minute - b.minute)
  let idx = 0
  let realStart = Date.now()

  const tick = setInterval(async () => {
    const elapsedReal = (Date.now() - realStart) / 1000
    const minuteNow = Math.min(96, Math.floor((elapsedReal * speed) / 60))
    if (minuteNow !== match.minute) {
      match = { ...match, minute: minuteNow }
      upsertMatch(match)
      emit.matchUpdate(io, match.id, match)
    }

    // emit pulse every ~5s
    if (Math.floor(elapsedReal) % 5 === 0) {
      emit.matchPulse(io, match.id, randomZones())
    }

    while (idx < events.length && events[idx].minute <= minuteNow) {
      const ev = { ...events[idx], match_id: match.id, created_at: new Date().toISOString() }
      idx++
      db.match_events.push(ev)
      emit.matchEvent(io, match.id, ev)

      if (ev.type === 'goal') {
        match = {
          ...match,
          home_score: match.home_score + (ev.team === 'home' ? 1 : 0),
          away_score: match.away_score + (ev.team === 'away' ? 1 : 0)
        }
        upsertMatch(match)
        emit.matchUpdate(io, match.id, match)
        emit.matchGoal(io, {
          player_name: ev.player_name, minute: ev.minute, team: ev.team,
          rarity: ev.rarity || 'EPIC', is_rare: !!ev.is_rare
        })
      }

      if (ev.opens_prediction) {
        const pid = `p_${match.id}_${ev.minute}`
        const pred = {
          id: pid, match_id: match.id, type: ev.opens_prediction.type || 'goal_scorer',
          question: ev.opens_prediction.question, options: ev.opens_prediction.options,
          opens_at: new Date().toISOString(),
          closes_at: new Date(Date.now() + 5 * 60_000).toISOString(), // 5 minutes
          correct_answer: null, resolved_at: null, submission_count: 0
        }
        db.predictions.set(pid, pred)
        if (mode === 'postgres') {
          await query(
            `INSERT INTO predictions (id, match_id, type, question, options, opens_at, closes_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [pred.id, pred.match_id, pred.type, pred.question, JSON.stringify(pred.options), pred.opens_at, pred.closes_at]
          ).catch(e => console.error('[sim] insert prediction error:', e.message))
        }
        emit.predictionNew(io, pred)
      }
      if (ev.resolves_prediction) {
        let p = db.predictions.get(ev.resolves_prediction.id)
        if (mode === 'postgres' && !p) {
          // Fetch from postgres
          const { rows } = await query('SELECT * FROM predictions WHERE id = $1', [ev.resolves_prediction.id])
          if (rows[0]) p = { ...rows[0], options: rows[0].options }
        }
        if (p) {
          p.correct_answer = ev.resolves_prediction.correct_answer
          p.resolved_at = new Date().toISOString()
          const awards = await grade(p)
          emit.predictionResolved(io, { prediction_id: p.id, correct_answer: p.correct_answer, awards })
          emit.leaderboardUpdate(io)
        }
      }
    }

    if (minuteNow >= 95) {
      clearInterval(tick)
      match = { ...match, status: 'finished' }
      upsertMatch(match)
      emit.matchUpdate(io, match.id, match)
      console.log('[sim] finished')
    }
  }, 1000)

  return () => clearInterval(tick)
}

function grade(p) {
  if (mode === 'postgres') return gradePostgres(p)
  // Memory mode
  const winners = []
  for (const sub of db.user_predictions) {
    if (sub.prediction_id !== p.id) continue
    const correct = sub.selected_option === p.correct_answer
    sub.is_correct = correct
    sub.points_earned = correct ? Math.round(100 * (sub.speed_bonus || 1)) : 0
    if (correct) winners.push({ user_id: sub.user_id, points_earned: sub.points_earned })
    const u = db.users.get(sub.user_id)
    if (u) {
      u.points_total = (u.points_total || 0) + (sub.points_earned || 0)
      u.predictions_made = (u.predictions_made || 0) + 1
      if (correct) u.predictions_correct = (u.predictions_correct || 0) + 1
    }
  }
  return winners
}

async function gradePostgres(p) {
  try {
    // Get all submissions for this prediction
    const { rows: subs } = await query(
      'SELECT * FROM user_predictions WHERE prediction_id = $1', [p.id]
    )
    const winners = []
    for (const sub of subs) {
      const correct = sub.selected_option === p.correct_answer
      const pointsEarned = correct ? Math.round(100 * (Number(sub.speed_bonus) || 1)) : 0

      // Update the submission
      await query(
        'UPDATE user_predictions SET is_correct = $1, points_earned = $2 WHERE id = $3',
        [correct, pointsEarned, sub.id]
      )

      // Update user stats
      if (pointsEarned > 0) {
        await query(
          `UPDATE users SET
            points_total = points_total + $1,
            predictions_made = predictions_made + 1,
            predictions_correct = predictions_correct + 1
          WHERE id = $2`, [pointsEarned, sub.user_id]
        )
        winners.push({ user_id: sub.user_id, points_earned: pointsEarned })
      } else {
        await query(
          'UPDATE users SET predictions_made = predictions_made + 1 WHERE id = $1', [sub.user_id]
        )
      }
    }

    // Mark prediction as resolved
    await query(
      'UPDATE predictions SET correct_answer = $1, resolved_at = $2 WHERE id = $3',
      [p.correct_answer, p.resolved_at, p.id]
    )

    return winners
  } catch (err) {
    console.error('[sim] gradePostgres error:', err.message)
    return []
  }
}

async function mintRareDrop(_io, _ev) {
  // Removed — random drops are no longer minted by the simulator.
  // Vault items are earned via XP purchase only.
  return
}

function upsertMatch(m) {
  db.matches.set(m.id, m)
  if (mode === 'postgres') {
    query(
      `INSERT INTO matches (id, home_team, away_team, home_score, away_score, minute, status, stadium, matchday, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET home_score = $4, away_score = $5, minute = $6, status = $7`,
      [m.id, m.home_team, m.away_team, m.home_score, m.away_score, m.minute, m.status, m.stadium, m.matchday, m.started_at || null]
    ).catch(e => console.error('[sim] upsert match error:', e.message))
  }
}

function randomZones() {
  return {
    home: Array.from({ length: 4 }, () => ({ x: 15 + Math.random() * 35, y: 10 + Math.random() * 40, r: 4 + Math.random() * 5, intensity: 0.3 + Math.random() * 0.4 })),
    away: Array.from({ length: 3 }, () => ({ x: 55 + Math.random() * 35, y: 10 + Math.random() * 40, r: 3 + Math.random() * 4, intensity: 0.2 + Math.random() * 0.3 }))
  }
}
