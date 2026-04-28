import { Router } from 'express'
import { supabase, ready } from '../db/supabase.js'
import { db } from '../db/memory.js'

const r = Router()

r.get('/:matchId', async (req, res, next) => {
  try {
    if (ready) {
      const { data, error } = await supabase.from('quiz_questions').select('*').eq('match_id', req.params.matchId).limit(5)
      if (error) throw error
      return res.json((data || []).map((q) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options })))
    }
    const list = [...db.quiz_questions.values()].filter((q) => q.match_id === req.params.matchId).slice(0, 5)
    res.json(list)
  } catch (e) { next(e) }
})

r.get('/:matchId/history', async (req, res, next) => {
  try {
    // simplified — last 10 quiz session totals
    res.json([])
  } catch (e) { next(e) }
})

r.post('/answer', async (req, res, next) => {
  try {
    const { user_id, question_id, answer, elapsed_seconds } = req.body || {}
    if (!user_id || !question_id) return res.status(400).json({ error: 'missing fields' })
    let q
    if (ready) {
      const { data, error } = await supabase.from('quiz_questions').select('*').eq('id', question_id).single()
      if (error) throw error
      q = data
    } else q = db.quiz_questions.get(question_id)
    if (!q) return res.status(404).json({ error: 'question not found' })
    const correct = answer === q.correct_answer
    const speedBonus = elapsed_seconds != null && elapsed_seconds < 8 ? 25 : 0
    const points_earned = correct ? 50 + speedBonus : 0
    if (ready) {
      // Increment user.points_total via SQL RPC ideally; here just upsert a record
      await supabase.from('quiz_attempts').insert({ user_id, question_id, answer, correct, points_earned, elapsed_seconds })
    }
    res.json({ correct, points_earned, fun_fact: q.fun_fact })
  } catch (e) { next(e) }
})

export default r
