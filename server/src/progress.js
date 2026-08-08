import { readRecord, writeRecord } from './store.js'

const VALID_STATUSES = ['not-started', 'in-progress', 'stuck', 'done']
const MAX_NOTES_LENGTH = 5000

const badRequest = (message) => {
  const err = new Error(message)
  err.status = 400
  return err
}

const emptyRecord = (workId, courseId) => ({
  workId,
  courseId,
  status: 'not-started',
  completedSteps: [],
  secondsSpent: 0,
  notes: '',
  startedAt: null,
  updatedAt: new Date().toISOString(),
})

/** Validates a partial WorkProgress patch. Throws a 400-tagged error on anything malformed. */
function validatePatch(patch) {
  if (!patch || typeof patch !== 'object') throw badRequest('Patch must be an object.')

  if ('status' in patch && !VALID_STATUSES.includes(patch.status)) {
    throw badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  if ('secondsSpent' in patch) {
    const { secondsSpent } = patch
    if (!Number.isInteger(secondsSpent) || secondsSpent < 0) {
      throw badRequest('secondsSpent must be a non-negative integer.')
    }
  }

  if ('completedSteps' in patch) {
    const { completedSteps } = patch
    if (!Array.isArray(completedSteps) || !completedSteps.every((n) => Number.isInteger(n) && n >= 0)) {
      throw badRequest('completedSteps must be an array of non-negative integers.')
    }
  }

  if ('notes' in patch) {
    if (typeof patch.notes !== 'string') throw badRequest('notes must be a string.')
    if (patch.notes.length > MAX_NOTES_LENGTH) {
      throw badRequest(`notes must be ${MAX_NOTES_LENGTH} characters or fewer.`)
    }
  }
}

/** Dedupes and sorts step indexes, since the client may send them in any order. */
const normalizeCompletedSteps = (steps) => [...new Set(steps)].sort((a, b) => a - b)

/** All progress records for one person, keyed by workId. */
export async function getAllProgress(identity) {
  return readRecord(identity)
}

/**
 * Merges a validated patch onto the existing (or a fresh default) record for
 * one assignment and persists it. Never mutates the record it read.
 */
export async function saveProgress(identity, workId, courseId, patch) {
  if (!workId) throw badRequest('workId is required.')
  if (!courseId) throw badRequest('courseId is required.')
  validatePatch(patch)

  const all = await readRecord(identity)
  const existing = all[workId] ?? emptyRecord(workId, courseId)

  const movingOffNotStarted =
    existing.status === 'not-started' && patch.status && patch.status !== 'not-started'

  const updated = {
    ...existing,
    ...patch,
    workId,
    courseId,
    ...(patch.completedSteps ? { completedSteps: normalizeCompletedSteps(patch.completedSteps) } : {}),
    startedAt: movingOffNotStarted ? new Date().toISOString() : existing.startedAt,
    updatedAt: new Date().toISOString(),
  }

  const nextAll = { ...all, [workId]: updated }
  await writeRecord(identity, nextAll)
  return updated
}
