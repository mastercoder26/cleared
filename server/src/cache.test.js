import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LruCache } from './cache.js'

test('stores and retrieves values', () => {
  const cache = new LruCache(3)
  cache.set('a', 1)
  assert.equal(cache.get('a'), 1)
  assert.equal(cache.has('a'), true)
  assert.equal(cache.has('missing'), false)
})

test('evicts the least recently used entry once over capacity', () => {
  const cache = new LruCache(2)
  cache.set('a', 1)
  cache.set('b', 2)
  cache.set('c', 3) // evicts 'a', the oldest untouched entry
  assert.equal(cache.has('a'), false)
  assert.equal(cache.has('b'), true)
  assert.equal(cache.has('c'), true)
  assert.equal(cache.size, 2)
})

test('reading an entry refreshes its recency', () => {
  const cache = new LruCache(2)
  cache.set('a', 1)
  cache.set('b', 2)
  cache.get('a') // 'a' is now more recent than 'b'
  cache.set('c', 3) // should evict 'b', not 'a'
  assert.equal(cache.has('a'), true)
  assert.equal(cache.has('b'), false)
  assert.equal(cache.has('c'), true)
})
