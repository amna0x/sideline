import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

import { createApp } from '../app.js'

test('GET /api/health returns ok', async () => {
  const app = createApp()
  const res = await request(app).get('/api/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.ok(typeof res.body.ts === 'number')
})

test('POST /api/predictions/submit without auth → 401 (memory mode)', async () => {
  const app = createApp()
  const res = await request(app).post('/api/predictions/submit').send({
    prediction_id: 'p1', selected_option: 'home'
  })
  assert.equal(res.status, 401)
})

test('POST /api/predictions/submit with x-user-id header is accepted but rejected by 404 (no such prediction)', async () => {
  const app = createApp()
  const res = await request(app)
    .post('/api/predictions/submit')
    .set('x-user-id', 'guest_test')
    .send({ prediction_id: 'nonexistent', selected_option: 'home' })
  assert.equal(res.status, 404)
})

test('PATCH /api/users/:id without auth → 401', async () => {
  const app = createApp()
  const res = await request(app).patch('/api/users/u1').send({ username: 'newname' })
  assert.equal(res.status, 401)
})

test('PATCH /api/users/:id rejecting another user → 403', async () => {
  const app = createApp()
  const res = await request(app)
    .patch('/api/users/owner')
    .set('x-user-id', 'attacker')
    .send({ username: 'newname' })
  assert.equal(res.status, 403)
})

test('PATCH /api/users/:id rejects unknown fields with 400', async () => {
  const app = createApp()
  const res = await request(app)
    .patch('/api/users/me')
    .set('x-user-id', 'me')
    .send({ points_total: 999999 })
  assert.equal(res.status, 400)
  assert.equal(res.body.error, 'invalid_input')
})
