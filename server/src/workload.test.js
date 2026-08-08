import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildWorkload, estimateMinutes } from './workload.js'

const isoInDays = (days) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
}

const baseItem = (overrides = {}) => ({
  id: 'w1',
  courseId: 'c1',
  courseName: 'Class',
  title: 'Thing',
  workType: 'ASSIGNMENT',
  maxPoints: 20,
  description: 'short',
  dueAt: isoInDays(1),
  submissionState: 'NEW',
  ...overrides,
})

test('empty items produce empty, "clear" days for every requested day', () => {
  const result = buildWorkload([], 5)
  assert.equal(result.length, 5)
  for (const day of result) {
    assert.equal(day.dueCount, 0)
    assert.equal(day.estimatedMinutes, 0)
    assert.equal(day.load, 'clear')
    assert.deepEqual(day.items, [])
  }
})

test('overdue items roll onto today instead of their original date', () => {
  const overdue = baseItem({ dueAt: isoInDays(-5) })
  const result = buildWorkload([overdue], 3)
  assert.equal(result[0].dueCount, 1)
  assert.equal(result[0].items[0].id, 'w1')
  for (const day of result.slice(1)) assert.equal(day.dueCount, 0)
})

test('skips items already turned in or returned', () => {
  const turnedIn = baseItem({ submissionState: 'TURNED_IN' })
  const returned = baseItem({ id: 'w2', submissionState: 'RETURNED' })
  const result = buildWorkload([turnedIn, returned], 3)
  assert.equal(result.reduce((sum, d) => sum + d.dueCount, 0), 0)
})

test('skips items with no due date', () => {
  const noDue = baseItem({ dueAt: null })
  const result = buildWorkload([noDue], 3)
  assert.equal(result.reduce((sum, d) => sum + d.dueCount, 0), 0)
})

test('items beyond the requested window are dropped', () => {
  const farOut = baseItem({ dueAt: isoInDays(30) })
  const result = buildWorkload([farOut], 3)
  assert.equal(result.reduce((sum, d) => sum + d.dueCount, 0), 0)
})

test('load bucketing follows the documented thresholds', () => {
  // clear: 0 minutes
  assert.equal(buildWorkload([], 1)[0].load, 'clear')

  // light: under 60 minutes total
  const light = buildWorkload(
    [baseItem({ workType: 'MULTIPLE_CHOICE_QUESTION', maxPoints: 5, description: '', dueAt: isoInDays(0) })],
    1,
  )
  assert.equal(light[0].load, 'light')

  // heavy: several large assignments due the same day
  const heavyItems = Array.from({ length: 5 }, (_, i) =>
    baseItem({ id: `h${i}`, maxPoints: 100, description: 'x'.repeat(900), dueAt: isoInDays(0) }),
  )
  const heavy = buildWorkload(heavyItems, 1)
  assert.equal(heavy[0].load, 'heavy')
})

test('estimateMinutes never goes below the floor and reflects heuristic inputs', () => {
  const cheap = estimateMinutes({ workType: 'MULTIPLE_CHOICE_QUESTION', maxPoints: 1, description: '' })
  assert.ok(cheap >= 10)

  const expensive = estimateMinutes({ workType: 'ASSIGNMENT', maxPoints: 100, description: 'x'.repeat(900) })
  assert.ok(expensive > cheap)
})
