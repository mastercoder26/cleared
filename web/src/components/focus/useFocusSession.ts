import { useEffect, useRef, useState } from 'react'

const TICK_MS = 1000
const TIMER_CACHE_PREFIX = 'cleared.focus-timer.v1.'
const BREAK_DECLINE_PREFIX = 'cleared.focus-break-declined.'

interface TimerCache {
  stepIndex: number
  elapsedSeconds: number
}

function readTimerCache(workId: string): TimerCache | null {
  try {
    const raw = localStorage.getItem(TIMER_CACHE_PREFIX + workId)
    return raw ? (JSON.parse(raw) as TimerCache) : null
  } catch {
    return null
  }
}

function writeTimerCache(workId: string, cache: TimerCache) {
  try {
    localStorage.setItem(TIMER_CACHE_PREFIX + workId, JSON.stringify(cache))
  } catch {
    // best-effort only
  }
}

function clearTimerCache(workId: string) {
  try {
    localStorage.removeItem(TIMER_CACHE_PREFIX + workId)
  } catch {
    // best-effort only
  }
}

/**
 * The ticking clock for whichever step is currently on screen. Elapsed time
 * is cached every tick so a refresh, a tab close, or an accidental exit
 * never loses in-progress time — only a *completed* step commits its time
 * into the synced WorkProgress (via the caller's `addSeconds`).
 */
export function useStepTimer(workId: string | undefined, stepIndex: number) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<number | undefined>(undefined)

  // A new step comes into view: load its own cached time (if any) and start paused.
  useEffect(() => {
    if (!workId) return
    const cached = readTimerCache(workId)
    setElapsedSeconds(cached && cached.stepIndex === stepIndex ? cached.elapsedSeconds : 0)
    setRunning(false)
  }, [workId, stepIndex])

  useEffect(() => {
    if (!running || !workId) return
    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        writeTimerCache(workId, { stepIndex, elapsedSeconds: next })
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(intervalRef.current)
  }, [running, workId, stepIndex])

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const toggle = () => setRunning((r) => !r)
  const commitAndReset = () => {
    setRunning(false)
    setElapsedSeconds(0)
    if (workId) clearTimerCache(workId)
  }

  return { elapsedSeconds, running, start, pause, toggle, commitAndReset }
}

/** "Decline permanently for this session" — sessionStorage is the natural fit: it clears on tab close. */
export function useBreakDecline(workId: string | undefined) {
  const key = workId ? BREAK_DECLINE_PREFIX + workId : null

  const declined = () => {
    if (!key) return false
    try {
      return sessionStorage.getItem(key) === '1'
    } catch {
      return false
    }
  }

  const decline = () => {
    if (!key) return
    try {
      sessionStorage.setItem(key, '1')
    } catch {
      // best-effort only
    }
  }

  return { declined, decline }
}
