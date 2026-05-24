import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

import { createApp } from '../app.js'

const PNG_MIN = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

test('POST /api/users/:id/avatar without auth → 401', async () => {
  const app = createApp()
  const res = await request(app).post('/api/users/u1/avatar').attach('file', PNG_MIN, { filename: 'a.png', contentType: 'image/png' })
  assert.equal(res.status, 401)
})

test('POST /api/users/:id/avatar cross-user → 403', async () => {
  const app = createApp()
  const res = await request(app)
    .post('/api/users/owner/avatar')
    .set('x-user-id', 'attacker')
    .attach('file', PNG_MIN, { filename: 'a.png', contentType: 'image/png' })
  assert.equal(res.status, 403)
})

test('POST /api/users/:id/avatar rejects unsupported MIME → 415', async () => {
  const app = createApp()
  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('x-user-id', 'me')
    .attach('file', Buffer.from('text'), { filename: 'a.txt', contentType: 'text/plain' })
  assert.equal(res.status, 415)
})

test('POST /api/users/:id/avatar rejects oversized payload → 413', async () => {
  const app = createApp()
  const big = Buffer.alloc(6 * 1024 * 1024, 0xff)
  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('x-user-id', 'me')
    .attach('file', big, { filename: 'big.png', contentType: 'image/png' })
  assert.equal(res.status, 413)
})

test('POST /api/users/:id/avatar memory mode returns data URL + persists', async () => {
  const app = createApp()
  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('x-user-id', 'me')
    .attach('file', PNG_MIN, { filename: 'a.png', contentType: 'image/png' })
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.match(res.body.avatar_url, /^data:image\/png;base64,/)

  const profile = await request(app).get('/api/users/me')
  assert.equal(profile.status, 200)
  assert.equal(profile.body.avatar_url, res.body.avatar_url)
})

test('POST /api/users/:id/avatar without file field → 400', async () => {
  const app = createApp()
  const res = await request(app)
    .post('/api/users/me/avatar')
    .set('x-user-id', 'me')
    .field('foo', 'bar')
  assert.equal(res.status, 400)
})
