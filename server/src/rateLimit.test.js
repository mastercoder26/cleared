import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RateLimiter } from './rateLimit.js'

test('allows requests under the limit', () => {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 })
  assert.equal(limiter.tryConsume('a'), true)
  assert.equal(limiter.tryConsume('a'), true)
  assert.equal(limiter.tryConsume('a'), true)
})

test('rejects requests over the limit within the window', () => {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 })
  assert.equal(limiter.tryConsume('b'), true)
  assert.equal(limiter.tryConsume('b'), true)
  assert.equal(limiter.tryConsume('b'), false)
})

test('keys are independent of one another', () => {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 })
  assert.equal(limiter.tryConsume('x'), true)
  assert.equal(limiter.tryConsume('y'), true)
  assert.equal(limiter.tryConsume('x'), false)
})

test('window resets after it elapses', async () => {
  const limiter = new RateLimiter({ windowMs: 30, maxRequests: 1 })
  assert.equal(limiter.tryConsume('c'), true)
  assert.equal(limiter.tryConsume('c'), false)
  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(limiter.tryConsume('c'), true)
})
