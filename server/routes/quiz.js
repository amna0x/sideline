import { Router } from 'express'
import { supabase, ready } from '../db/supabase.js'
import { db } from '../db/memory.js'
import { generateQuiz } from '../services/gemini.js'

const r = Router()

// In-memory cache for dynamic quizzes
const quizCache = new Map()

r.get('/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params

    // 1. Check cache
    if (quizCache.has(matchId)) {
      return res.json(quizCache.get(matchId))
    }

    // 2. Fetch match info
    let match = null
    if (ready) {
      const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single()
      if (!error) match = data
    } else {
      match = db.matches.get(matchId)
    }

    const homeTeam = match?.home_team || 'Borussia Dortmund'
    const awayTeam = match?.away_team || 'FC Bayern München'

    // 3. Generate dynamic quiz with Gemini/Claude
    let questions = await generateQuiz(matchId, homeTeam, awayTeam)

    if (questions && Array.isArray(questions) && questions.length > 0) {
      // Add questions to the database/in-memory store so they can be answered
      for (const q of questions) {
        db.quiz_questions.set(q.id, q)
        if (ready) {
          await supabase.from('quiz_questions').upsert({
            id: q.id,
            match_id: matchId,
            question: q.question,
            options: JSON.stringify(q.options),
            correct_answer: q.correct_answer,
            fun_fact: q.fun_fact,
            difficulty: q.difficulty || 'medium'
          })
        }
      }
      
      quizCache.set(matchId, questions)
      return res.json(questions)
    }

    // 4. Fall back to static seed questions
    console.warn('[Quiz Route] Dynamic quiz generation unavailable or failed. Using fallback seed questions.');
    let list = []
    if (ready) {
      const { data, error } = await supabase.from('quiz_questions').select('*').eq('match_id', matchId).limit(5)
      if (error) throw error
      list = (data || []).map((q) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options }))
    } else {
      list = [...db.quiz_questions.values()].filter((q) => q.match_id === matchId).slice(0, 5)
    }
    
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
      q = { ...data, options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options }
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
