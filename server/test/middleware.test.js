import { test } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import { z } from 'zod'

import { validate } from '../middleware/validate.js'
import { requireAuth, requireSelf } from '../middleware/auth.js'

function appWith(handler) {
  const app = express()
  app.use(express.json())
  handler(app)
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message })
  })
  return app
}

test('validate: rejects invalid body with 400 + issues', async () => {
  const schema = z.object({ name: z.string().min(2) })
  const app = appWith((a) => {
    a.post('/x', validate({ body: schema }), (req, res) => res.json(req.body))
  })
  const res = await request(app).post('/x').send({ name: 'a' })
  assert.equal(res.status, 400)
  assert.equal(res.body.error, 'invalid_input')
  assert.ok(Array.isArray(res.body.issues))
})

test('validate: passes valid body and parses defaults', async () => {
  const schema = z.object({ name: z.string(), age: z.number().int().default(1) })
  const app = appWith((a) => {
    a.post('/x', validate({ body: schema }), (req, res) => res.json(req.body))
  })
  const res = await request(app).post('/x').send({ name: 'ok' })
  assert.equal(res.status, 200)
  assert.equal(res.body.name, 'ok')
  assert.equal(res.body.age, 1)
})

test('requireAuth (memory mode): falls back to x-user-id header', async () => {
  const app = appWith((a) => {
    a.get('/me', requireAuth, (req, res) => res.json(req.user))
  })
  const res = await request(app).get('/me').set('x-user-id', 'guest123')
  assert.equal(res.status, 200)
  assert.equal(res.body.id, 'guest123')
  assert.equal(res.body.guest, true)
})

test('requireAuth (memory mode): 401 when no fallback', async () => {
  const app = appWith((a) => {
    a.get('/me', requireAuth, (_req, res) => res.json({ ok: true }))
  })
  const res = await request(app).get('/me')
  assert.equal(res.status, 401)
  assert.equal(res.body.error, 'unauthorized')
})

test('requireSelf: blocks mismatching user with 403', async () => {
  const app = appWith((a) => {
    a.patch('/u/:id', requireAuth, requireSelf('id'), (_req, res) => res.json({ ok: true }))
  })
  const res = await request(app).patch('/u/abc').set('x-user-id', 'other')
  assert.equal(res.status, 403)
})

test('requireSelf: allows matching user', async () => {
  const app = appWith((a) => {
    a.patch('/u/:id', requireAuth, requireSelf('id'), (_req, res) => res.json({ ok: true }))
  })
  const res = await request(app).patch('/u/abc').set('x-user-id', 'abc')
  assert.equal(res.status, 200)
})
