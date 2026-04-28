// Match simulator — replays a JSON timeline and emits Socket.io events.
// Call startSimulator(io) from the server, or run via `npm run simulate`.

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/memory.js'
import { supabase, ready } from '../db/supabase.js'
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
        if (ev.is_rare) await mintRareDrop(io, ev)
      }

      if (ev.opens_prediction) {
        const pid = `p_${match.id}_${ev.minute}`
        const pred = {
          id: pid, match_id: match.id, type: ev.opens_prediction.type || 'goal_scorer',
          question: ev.opens_prediction.question, options: ev.opens_prediction.options,
          opens_at: new Date().toISOString(),
          closes_at: new Date(Date.now() + 60_000).toISOString(),
          correct_answer: null, resolved_at: null
        }
        db.predictions.set(pid, pred)
        emit.predictionNew(io, pred)
      }
      if (ev.resolves_prediction) {
        const p = db.predictions.get(ev.resolves_prediction.id)
        if (p) {
          p.correct_answer = ev.resolves_prediction.correct_answer
          p.resolved_at = new Date().toISOString()
          const awards = grade(p)
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

async function mintRareDrop(io, ev) {
  const item = [...db.vault_items.values()].find((v) => v.tier === 'mythic' && v.remaining_supply > 0)
  if (!item) return
  item.remaining_supply -= 1
  // mint to the most active recent predictor as a hackathon shortcut
  const recent = db.user_predictions.slice(-1)[0]
  if (!recent) return
  const record = { id: `uv_${Date.now()}`, user_id: recent.user_id, vault_item_id: item.id, earned_at: new Date().toISOString(), redeemed: false }
  db.user_vault.push(record)
  emit.vaultMinted(io, record)
  emit.vaultSupply(io, { vault_item_id: item.id, remaining_supply: item.remaining_supply })
  if (ready) await supabase.from('user_vault').insert(record)
}

function upsertMatch(m) {
  db.matches.set(m.id, m)
  if (ready) supabase.from('matches').upsert(m).then().catch(() => {})
}

function randomZones() {
  return {
    home: Array.from({ length: 4 }, () => ({ x: 15 + Math.random() * 35, y: 10 + Math.random() * 40, r: 4 + Math.random() * 5, intensity: 0.3 + Math.random() * 0.4 })),
    away: Array.from({ length: 3 }, () => ({ x: 55 + Math.random() * 35, y: 10 + Math.random() * 40, r: 3 + Math.random() * 4, intensity: 0.2 + Math.random() * 0.3 }))
  }
}
