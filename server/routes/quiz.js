import { Router } from 'express'
import { mode } from '../db/index.js'
import { query } from '../db/postgres.js'
import { db } from '../db/memory.js'
import { generateQuiz } from '../services/gemini.js'

const r = Router()

const quizCache = new Map()

r.get('/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params

    if (quizCache.has(matchId)) {
      return res.json(quizCache.get(matchId))
    }

    let match = null
    if (mode === 'postgres') {
      const { rows } = await query('SELECT * FROM matches WHERE id = $1', [matchId])
      match = rows[0] || null
    } else {
      match = db.matches.get(matchId)
    }

    const homeTeam = match?.home_team || 'Borussia Dortmund'
    const awayTeam = match?.away_team || 'FC Bayern München'

    let questions = await generateQuiz(matchId, homeTeam, awayTeam)

    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        db.quiz_questions.set(q.id, q)
        if (mode === 'postgres') {
          await query(
            `INSERT INTO quiz_questions (id, match_id, question, options, correct_answer, fun_fact, difficulty)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET question = $3, options = $4, correct_answer = $5, fun_fact = $6, difficulty = $7`,
            [q.id, matchId, q.question, JSON.stringify(q.options), q.correct_answer, q.fun_fact, q.difficulty || 'medium']
          ).catch((e) => console.error('[quiz insert]', e.message))
        }
      }
      quizCache.set(matchId, questions)
      return res.json(questions)
    }

    console.warn('[Quiz Route] Dynamic quiz generation unavailable, using fallback seed.')
    let list = []
    if (mode === 'postgres') {
      const { rows } = await query('SELECT * FROM quiz_questions WHERE match_id = $1 LIMIT 5', [matchId])
      list = rows.map((q) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }))
    } else {
      list = [...db.quiz_questions.values()].filter((q) => q.match_id === matchId).slice(0, 5)
    }
    res.json(list)
  } catch (e) { next(e) }
})

r.get('/:matchId/history', async (_req, res, _next) => {
  res.json([])
})

r.post('/answer', async (req, res, next) => {
  try {
    const { user_id, question_id, answer, elapsed_seconds } = req.body || {}
    if (!user_id || !question_id) return res.status(400).json({ error: 'missing fields' })
    let q
    if (mode === 'postgres') {
      const { rows } = await query('SELECT * FROM quiz_questions WHERE id = $1', [question_id])
      if (!rows[0]) return res.status(404).json({ error: 'question not found' })
      q = { ...rows[0], options: typeof rows[0].options === 'string' ? JSON.parse(rows[0].options) : rows[0].options }
    } else {
      q = db.quiz_questions.get(question_id)
    }
    if (!q) return res.status(404).json({ error: 'question not found' })

    const correct = answer === q.correct_answer
    const speedBonus = elapsed_seconds != null && elapsed_seconds < 8 ? 25 : 0
    const points_earned = correct ? 50 + speedBonus : 0

    if (mode === 'postgres') {
      await query(
        'INSERT INTO quiz_attempts (user_id, question_id, answer, correct, points_earned, elapsed_seconds) VALUES ($1, $2, $3, $4, $5, $6)',
        [user_id, question_id, answer, correct, points_earned, elapsed_seconds]
      ).catch(() => {})
      if (correct) {
        await query('UPDATE users SET points_total = points_total + $1 WHERE id = $2', [points_earned, user_id]).catch(() => {})
      }
    }
    res.json({ correct, points_earned, fun_fact: q.fun_fact })
  } catch (e) { next(e) }
})

export default r
