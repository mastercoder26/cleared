import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from './api'
import type { WorkProgress, WorkStatus } from './types'

/**
 * cleared's own record of where a student is on a piece of work. This is
 * never written back to Google Classroom — it lives server-side per
 * student, mirrored here in localStorage so the page never has to wait on
 * (or break because of) the network.
 */

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

const STORAGE_PREFIX = 'cleared.progress.v1.'
const SAVE_DEBOUNCE_MS = 900

function emptyProgress(courseId: string, workId: string): WorkProgress {
  return {
    workId,
    courseId,
    status: 'not-started',
    completedSteps: [],
    secondsSpent: 0,
    notes: '',
    startedAt: null,
    updatedAt: new Date().toISOString(),
  }
}

function readCache(workId: string): WorkProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + workId)
    return raw ? (JSON.parse(raw) as WorkProgress) : null
  } catch {
    return null
  }
}

function writeCache(progress: WorkProgress) {
  try {
    localStorage.setItem(STORAGE_PREFIX + progress.workId, JSON.stringify(progress))
  } catch {
    // localStorage can be unavailable (private mode, full quota) — the cache is best-effort
  }
}

/** A validation-shaped failure (bad input) vs. a connectivity/availability failure. */
function isValidationFailure(err: unknown): boolean {
  return err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 404
}

/**
 * Owns one assignment's WorkProgress: seeds instantly from localStorage,
 * reconciles with the server in the background, and persists every change
 * with a debounced, patch-merging, optimistic save.
 *
 * If the backend isn't reachable (network error, 404 because the route
 * isn't deployed yet, 500) the hook keeps working from localStorage alone
 * and reports `syncState: 'offline'` — it never blocks the page or rolls
 * back real edits just because the server is unavailable. A genuine
 * validation failure (4xx) does roll back, since that means the save
 * itself was rejected, not merely delayed.
 */
export function useWorkProgress(courseId: string | undefined, workId: string | undefined) {
  const [progress, setProgress] = useState<WorkProgress | null>(null)
  const [syncState, setSyncState] = useState<SyncState>('idle')

  const saveTimer = useRef<number | undefined>(undefined)
  const pendingPatch = useRef<Partial<WorkProgress>>({})
  const preSaveSnapshot = useRef<WorkProgress | null>(null)

  useEffect(() => {
    if (!courseId || !workId) return
    const cached = readCache(workId) ?? emptyProgress(courseId, workId)
    setProgress(cached)
    setSyncState('idle')

    let cancelled = false
    api
      .progress()
      .then(({ progress: all }) => {
        if (cancelled) return
        const server = all[workId]
        if (server) {
          setProgress(server)
          writeCache(server)
        }
        setSyncState('saved')
      })
      .catch(() => {
        if (!cancelled) setSyncState('offline')
      })

    return () => {
      cancelled = true
    }
  }, [courseId, workId])

  const persist = useCallback(
    (next: WorkProgress, patch: Partial<WorkProgress>) => {
      writeCache(next)
      if (!courseId || !workId) return

      if (!preSaveSnapshot.current) preSaveSnapshot.current = next
      pendingPatch.current = { ...pendingPatch.current, ...patch }

      window.clearTimeout(saveTimer.current)
      setSyncState('saving')
      saveTimer.current = window.setTimeout(() => {
        const toSend = pendingPatch.current
        const snapshotBeforeSave = preSaveSnapshot.current
        pendingPatch.current = {}
        preSaveSnapshot.current = null

        api
          .saveProgress(workId, { ...toSend, courseId })
          .then(({ progress: saved }) => {
            setProgress(saved)
            writeCache(saved)
            setSyncState('saved')
          })
          .catch((err: unknown) => {
            if (isValidationFailure(err) && snapshotBeforeSave) {
              setProgress(snapshotBeforeSave)
              writeCache(snapshotBeforeSave)
              setSyncState('error')
            } else {
              // Server unreachable or not deployed yet — keep the local edit, just say so
              setSyncState('offline')
            }
          })
      }, SAVE_DEBOUNCE_MS)
    },
    [courseId, workId],
  )

  // Best-effort resync once the browser reports connectivity again.
  useEffect(() => {
    function handleOnline() {
      setProgress((prev) => {
        if (prev) persist(prev, prev)
        return prev
      })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [persist])

  const mutate = useCallback(
    (updater: (prev: WorkProgress) => { next: WorkProgress; patch: Partial<WorkProgress> }) => {
      setProgress((prev) => {
        if (!prev) return prev
        const { next, patch } = updater(prev)
        persist(next, patch)
        return next
      })
    },
    [persist],
  )

  const setStatus = useCallback(
    (status: WorkStatus) =>
      mutate((prev) => {
        const next = { ...prev, status, updatedAt: new Date().toISOString() }
        return { next, patch: { status } }
      }),
    [mutate],
  )

  /** Checks a step on if it's off, off if it's on — used by the manual checklist. */
  const toggleStep = useCallback(
    (index: number) =>
      mutate((prev) => {
        const completedSteps = prev.completedSteps.includes(index)
          ? prev.completedSteps.filter((i) => i !== index)
          : [...prev.completedSteps, index].sort((a, b) => a - b)
        const next = { ...prev, completedSteps, updatedAt: new Date().toISOString() }
        return { next, patch: { completedSteps } }
      }),
    [mutate],
  )

  const setNotes = useCallback(
    (notes: string) =>
      mutate((prev) => {
        const next = { ...prev, notes, updatedAt: new Date().toISOString() }
        return { next, patch: { notes } }
      }),
    [mutate],
  )

  /** Adds focused seconds (never subtracts) — used when a focus-mode step wraps up. */
  const addSeconds = useCallback(
    (deltaSeconds: number) =>
      mutate((prev) => {
        if (deltaSeconds <= 0) return { next: prev, patch: {} }
        const secondsSpent = prev.secondsSpent + deltaSeconds
        const next = { ...prev, secondsSpent, updatedAt: new Date().toISOString() }
        return { next, patch: { secondsSpent } }
      }),
    [mutate],
  )

  return { progress, syncState, setStatus, toggleStep, setNotes, addSeconds }
}

export const SYNC_MESSAGES: Record<SyncState, string | null> = {
  idle: null,
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Saved on this device — will sync when the connection is back',
  error: "Couldn't save that change, so it was undone",
}
