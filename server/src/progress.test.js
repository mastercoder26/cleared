import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cleared-progress-test-'))
process.env.DATA_DIR = tmpDir

const { saveProgress, getAllProgress } = await import('./progress.js')

test('valid patch creates and merges a record', async () => {
  const first = await saveProgress('id-1', 'work-1', 'course-1', { status: 'in-progress' })
  assert.equal(first.status, 'in-progress')
  assert.equal(first.workId, 'work-1')
  assert.equal(first.courseId, 'course-1')

  const second = await saveProgress('id-1', 'work-1', 'course-1', { notes: 'a note' })
  assert.equal(second.status, 'in-progress')
  assert.equal(second.notes, 'a note')

  const all = await getAllProgress('id-1')
  assert.equal(all['work-1'].notes, 'a note')
})

test('rejects an unknown status value', async () => {
  await assert.rejects(
    () => saveProgress('id-2', 'work-2', 'course-2', { status: 'floating' }),
    (err) => err.status === 400,
  )
})

test('rejects non-integer secondsSpent', async () => {
  await assert.rejects(
    () => saveProgress('id-3', 'work-3', 'course-3', { secondsSpent: 1.5 }),
    (err) => err.status === 400,
  )
})

test('rejects negative secondsSpent', async () => {
  await assert.rejects(
    () => saveProgress('id-4', 'work-4', 'course-4', { secondsSpent: -1 }),
    (err) => err.status === 400,
  )
})

test('rejects completedSteps that are not non-negative integers', async () => {
  await assert.rejects(
    () => saveProgress('id-5', 'work-5', 'course-5', { completedSteps: [1, -2] }),
    (err) => err.status === 400,
  )
  await assert.rejects(
    () => saveProgress('id-5', 'work-5', 'course-5', { completedSteps: 'nope' }),
    (err) => err.status === 400,
  )
})

test('dedupes and sorts completedSteps', async () => {
  const result = await saveProgress('id-6', 'work-6', 'course-6', { completedSteps: [3, 1, 1, 2] })
  assert.deepEqual(result.completedSteps, [1, 2, 3])
})

test('rejects notes over the character cap', async () => {
  await assert.rejects(
    () => saveProgress('id-7', 'work-7', 'course-7', { notes: 'x'.repeat(5001) }),
    (err) => err.status === 400,
  )
})

test('rejects missing workId or courseId', async () => {
  await assert.rejects(() => saveProgress('id-8', '', 'course-8', {}), (err) => err.status === 400)
  await assert.rejects(() => saveProgress('id-8', 'work-8', '', {}), (err) => err.status === 400)
})

test('sets startedAt the first time status moves off not-started', async () => {
  const created = await saveProgress('id-9', 'work-9', 'course-9', {})
  assert.equal(created.startedAt, null)

  const started = await saveProgress('id-9', 'work-9', 'course-9', { status: 'in-progress' })
  assert.notEqual(started.startedAt, null)

  const startedAt = started.startedAt
  const again = await saveProgress('id-9', 'work-9', 'course-9', { status: 'stuck' })
  assert.equal(again.startedAt, startedAt)
})
