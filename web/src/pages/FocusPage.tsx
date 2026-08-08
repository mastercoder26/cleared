import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Course, CourseWork, Rewrite } from '../lib/types'
import { useWorkProgress } from '../lib/progress'
import { useBreakDecline, useStepTimer } from '../components/focus/useFocusSession'
import { FocusStep } from '../components/focus/FocusStep'
import { FocusProgressRail } from '../components/focus/FocusProgressRail'
import { BreakPrompt } from '../components/focus/BreakPrompt'
import { UnstickFlow } from '../components/focus/UnstickFlow'
import { FocusComplete } from '../components/focus/FocusComplete'
import { StateBlock } from '../components/ui/StateBlock'
import '../components/focus/focus.css'

/**
 * Focus mode: one step on screen at a time, everything else gone. Exiting
 * always saves through useWorkProgress (which persists to localStorage
 * synchronously and the server on a debounce); re-entering resumes exactly
 * where the student left off because completedSteps/secondsSpent live in
 * that same synced record, and in-progress step time is cached separately
 * by useStepTimer.
 */
export function FocusPage() {
  const { courseId, workId } = useParams<{ courseId: string; workId: string }>()
  const navigate = useNavigate()

  const [course, setCourse] = useState<Course | null>(null)
  const [item, setItem] = useState<CourseWork | null>(null)
  const [rewrite, setRewrite] = useState<Rewrite | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showUnstick, setShowUnstick] = useState(false)
  const [showBreak, setShowBreak] = useState(false)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const hasAutoStarted = useRef(false)

  const { progress, setStatus, toggleStep, addSeconds } = useWorkProgress(courseId, workId)
  const breakDecline = useBreakDecline(workId)

  useEffect(() => {
    if (!courseId || !workId) return
    let cancelled = false
    setLoadError(null)

    Promise.all([api.courses(), api.oneCourseWork(courseId, workId)])
      .then(async ([coursesRes, workRes]) => {
        if (cancelled) return
        setCourse(coursesRes.courses.find((c) => c.id === courseId) ?? null)
        setItem(workRes.courseWork)
        const { rewrite: r } = await api.simplify(courseId, workId, false)
        if (!cancelled) setRewrite(r)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Could not load this assignment.')
      })

    return () => {
      cancelled = true
    }
  }, [courseId, workId])

  // Walking into focus mode counts as starting — but only nudge status forward, never backward.
  useEffect(() => {
    if (progress && progress.status === 'not-started' && !hasAutoStarted.current) {
      hasAutoStarted.current = true
      setStatus('in-progress')
    }
  }, [progress, setStatus])

  const steps = useMemo(() => rewrite?.steps ?? [], [rewrite])
  const completed = useMemo(() => new Set(progress?.completedSteps ?? []), [progress])
  const currentStepIndex = useMemo(() => {
    const firstOpen = steps.findIndex((_, i) => !completed.has(i))
    return firstOpen === -1 ? Math.max(steps.length - 1, 0) : firstOpen
  }, [steps, completed])
  const allDone = steps.length > 0 && completed.size === steps.length
  const visibleIndex = reviewIndex ?? currentStepIndex
  const visibleStep = steps[visibleIndex] as (typeof steps)[number] | undefined

  const timer = useStepTimer(workId, currentStepIndex)

  useEffect(() => {
    if (!visibleStep) return
    setAnnouncement(`Step ${visibleIndex + 1} of ${steps.length}: ${visibleStep.action}`)
  }, [visibleIndex, visibleStep, steps.length])

  const advance = useCallback(() => {
    if (reviewIndex !== null) {
      setReviewIndex(null)
      return
    }
    if (allDone || !steps[currentStepIndex]) return
    addSeconds(timer.elapsedSeconds)
    toggleStep(currentStepIndex)
    timer.commitAndReset()
    const isLastStep = currentStepIndex === steps.length - 1
    if (!isLastStep && !breakDecline.declined()) setShowBreak(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewIndex, allDone, steps, currentStepIndex, addSeconds, toggleStep, timer, breakDecline])

  const exitToAssignment = useCallback(() => {
    navigate(`/courses/${courseId}/coursework/${workId}`)
  }, [navigate, courseId, workId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return
      if (showUnstick || showBreak) {
        if (e.key === 'Escape') setShowUnstick(false) // BreakPrompt has its own explicit buttons
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (reviewIndex === null) timer.toggle()
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (reviewIndex !== null && reviewIndex + 1 < currentStepIndex) {
          setReviewIndex((r) => (r ?? 0) + 1)
        } else {
          advance()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setReviewIndex((r) => Math.max(0, (r ?? currentStepIndex) - 1))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (reviewIndex !== null) setReviewIndex(null)
        else exitToAssignment()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reviewIndex, currentStepIndex, advance, showUnstick, showBreak, timer, exitToAssignment])

  if (loadError) {
    return (
      <div className="focus-overlay focus-overlay--center">
        <StateBlock
          kind="error"
          title="Couldn't open focus mode"
          detail={loadError}
          action={
            <Link to={`/courses/${courseId}/coursework/${workId}`} className="btn btn--secondary">
              Back to assignment
            </Link>
          }
        />
      </div>
    )
  }

  if (!item || !rewrite || !progress) {
    return (
      <div className="focus-overlay focus-overlay--center">
        <StateBlock kind="loading" title="Getting your steps ready…" detail="Just a moment." />
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="focus-overlay focus-overlay--center">
        <StateBlock
          kind="empty"
          title="No steps to focus on yet"
          detail="This assignment doesn't have a step breakdown yet. Head back and try the plain summary instead."
          action={
            <Link to={`/courses/${courseId}/coursework/${workId}`} className="btn btn--primary">
              Back to assignment
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="focus-overlay">
      <div className="visually-hidden" aria-live="polite">
        {announcement}
      </div>

      <div className="focus-topbar">
        <button type="button" className="focus-exit" onClick={exitToAssignment}>
          <span aria-hidden="true">←</span> Exit focus mode
        </button>
        <p className="focus-topbar__title">
          {item.title}
          {course && <span className="focus-topbar__course"> · {course.name}</span>}
        </p>
        <button type="button" className="focus-unstick-trigger" onClick={() => setShowUnstick(true)}>
          I'm stuck
        </button>
      </div>

      <FocusProgressRail total={steps.length} currentIndex={currentStepIndex} visibleIndex={visibleIndex} completed={completed} />

      {allDone && reviewIndex === null ? (
        <FocusComplete
          courseId={courseId!}
          workId={workId!}
          totalSeconds={progress.secondsSpent}
          classroomLink={item.link}
          onMarkDone={() => setStatus('done')}
        />
      ) : (
        visibleStep && (
          <FocusStep
            step={visibleStep}
            stepNumber={visibleIndex + 1}
            totalSteps={steps.length}
            isReview={reviewIndex !== null}
            isDone={completed.has(visibleIndex)}
            elapsedSeconds={reviewIndex === null ? timer.elapsedSeconds : 0}
            running={reviewIndex === null && timer.running}
            onToggleTimer={timer.toggle}
            onAdvance={advance}
          />
        )
      )}

      <div className="focus-shortcuts">
        <span>
          <kbd>Space</kbd> start/pause
        </span>
        <span>
          <kbd>Enter</kbd> / <kbd>→</kbd> next
        </span>
        <span>
          <kbd>←</kbd> look back
        </span>
        <span>
          <kbd>Esc</kbd> exit
        </span>
      </div>

      {showBreak && (
        <BreakPrompt
          onContinue={() => setShowBreak(false)}
          onDeclineSession={() => {
            breakDecline.decline()
            setShowBreak(false)
          }}
        />
      )}

      {showUnstick && (
        <UnstickFlow
          courseId={courseId!}
          workId={workId!}
          step={visibleStep ?? null}
          stepIndex={visibleIndex}
          onClose={() => setShowUnstick(false)}
        />
      )}
    </div>
  )
}
