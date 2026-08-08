import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Course, CourseWork, Rewrite } from '../lib/types'
import { formatDue } from '../lib/due'
import { useWorkProgress } from '../lib/progress'
import { StateBlock } from '../components/ui/StateBlock'
import { Button } from '../components/ui/Button'
import { ReadAloudButton } from '../components/ui/ReadAloudButton'
import { StatusControl } from '../components/assignment/StatusControl'
import { StepsChecklist } from '../components/assignment/StepsChecklist'
import { NotesField } from '../components/assignment/NotesField'
import { StartWorkingButton } from '../components/assignment/StartWorkingButton'
import { PlanCard } from '../components/assignment/PlanCard'
import { UnstickFlow } from '../components/focus/UnstickFlow'
import '../components/assignment/assignment.css'
import '../components/focus/focus.css'

type ViewMode = 'plain' | 'steps' | 'original'

const EFFORT_LABEL: Record<Rewrite['effort'], string> = {
  quick: 'Quick · under 30 min',
  medium: 'Medium · 30–90 min',
  long: 'Long · 90+ min or multi-day',
}

export function AssignmentPage() {
  const { courseId, workId } = useParams<{ courseId: string; workId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [item, setItem] = useState<CourseWork | null>(null)
  const [rewrite, setRewrite] = useState<Rewrite | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [view, setView] = useState<ViewMode>('plain')
  const [showUnstick, setShowUnstick] = useState(false)

  const { progress, syncState, setStatus, toggleStep, setNotes } = useWorkProgress(courseId, workId)

  useEffect(() => {
    if (!courseId || !workId) return
    let cancelled = false
    setItem(null)
    setLoadError(null)

    Promise.all([api.courses(), api.oneCourseWork(courseId, workId)])
      .then(([coursesRes, workRes]) => {
        if (cancelled) return
        setCourse(coursesRes.courses.find((c) => c.id === courseId) ?? null)
        setItem(workRes.courseWork)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Could not load this assignment.')
      })

    return () => {
      cancelled = true
    }
  }, [courseId, workId])

  const runSimplify = useMemo(
    () => async (refresh: boolean) => {
      if (!courseId || !workId) return
      setRewriteLoading(true)
      setRewriteError(null)
      try {
        const { rewrite } = await api.simplify(courseId, workId, refresh)
        setRewrite(rewrite)
      } catch (err) {
        setRewriteError(err instanceof ApiError ? err.message : 'Could not simplify this assignment.')
      } finally {
        setRewriteLoading(false)
      }
    },
    [courseId, workId],
  )

  useEffect(() => {
    if (item) void runSimplify(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  if (loadError) {
    return <StateBlock kind="error" title="Couldn't load this assignment" detail={loadError} />
  }
  if (!item) {
    return <StateBlock kind="loading" title="Loading assignment…" />
  }

  const handleStatusChange = (status: NonNullable<typeof progress>['status']) => {
    setStatus(status)
    if (status === 'stuck') setShowUnstick(true)
  }

  return (
    <div>
      <header className="detail-header">
        <Link to={`/courses/${courseId}`} className="detail-header__crumb">
          ← {course?.name ?? 'Back to class'}
        </Link>
        <h1 className="detail-header__title">{item.title}</h1>
        <div className="detail-header__meta">
          <span>{formatDue(item.dueAt)}</span>
          {item.maxPoints !== null && <span>· {item.maxPoints} points</span>}
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer">
              · Open in Classroom
            </a>
          )}
        </div>
      </header>

      {courseId && workId && <PlanCard courseId={courseId} workId={workId} />}

      {progress && (
        <StatusControl status={progress.status} syncState={syncState} onChange={handleStatusChange} />
      )}

      {courseId && workId && (
        <StartWorkingButton courseId={courseId} workId={workId} ready={Boolean(rewrite && rewrite.steps.length > 0)} />
      )}

      <button type="button" className="unstick-inline-trigger" onClick={() => setShowUnstick(true)}>
        I'm stuck on this
      </button>

      <div className="view-toggle" role="tablist" aria-label="View mode">
        <ViewTab mode="plain" current={view} onClick={setView}>
          Plain summary
        </ViewTab>
        <ViewTab mode="steps" current={view} onClick={setView}>
          Steps
        </ViewTab>
        <ViewTab mode="original" current={view} onClick={setView}>
          Teacher's original text
        </ViewTab>
      </div>

      {rewriteLoading && <StateBlock kind="loading" title="Rewriting this assignment…" detail="Usually takes a few seconds." />}

      {rewriteError && !rewriteLoading && (
        <StateBlock
          kind="error"
          title="Couldn't rewrite this assignment"
          detail={rewriteError}
          action={
            <Button variant="secondary" onClick={() => void runSimplify(true)}>
              Try again
            </Button>
          }
        />
      )}

      {rewrite && !rewriteLoading && view === 'plain' && (
        <PlainView rewrite={rewrite} onRefresh={() => void runSimplify(true)} />
      )}

      {rewrite && !rewriteLoading && view === 'steps' && progress && (
        <StepsChecklist rewrite={rewrite} completedSteps={progress.completedSteps} onToggle={toggleStep} />
      )}

      {view === 'original' && <OriginalView item={item} />}

      {progress && <NotesField value={progress.notes} onChange={setNotes} />}

      {showUnstick && courseId && workId && (
        <UnstickFlow
          courseId={courseId}
          workId={workId}
          step={null}
          stepIndex={null}
          onClose={() => setShowUnstick(false)}
        />
      )}
    </div>
  )
}

function ViewTab({
  mode,
  current,
  onClick,
  children,
}: {
  mode: ViewMode
  current: ViewMode
  onClick: (m: ViewMode) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-pressed={current === mode}
      aria-selected={current === mode}
      className="view-toggle__btn"
      onClick={() => onClick(mode)}
    >
      {children}
    </button>
  )
}

function PlainView({ rewrite, onRefresh }: { rewrite: Rewrite; onRefresh: () => void }) {
  const spoken = [
    rewrite.plain.whatToDo,
    rewrite.plain.handIn && `You hand in: ${rewrite.plain.handIn}`,
    rewrite.plain.why,
    rewrite.plain.watchOut && `Watch out: ${rewrite.plain.watchOut}`,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <>
      <div className="plain-card">
        <div className="plain-card__what-row">
          <p className="plain-card__what">{rewrite.plain.whatToDo}</p>
          <ReadAloudButton text={spoken} />
        </div>

        {rewrite.plain.handIn && (
          <PlainRow label="What you hand in" value={rewrite.plain.handIn} />
        )}
        {rewrite.plain.why && <PlainRow label="Why it's assigned" value={rewrite.plain.why} />}

        <span className="badge badge--accent effort-pill">{EFFORT_LABEL[rewrite.effort]}</span>

        {rewrite.plain.watchOut && (
          <div className="watch-out">
            <span aria-hidden="true">⚠</span>
            <span>{rewrite.plain.watchOut}</span>
          </div>
        )}
      </div>

      {rewrite.materials.length > 0 && (
        <section aria-labelledby="materials-heading" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 id="materials-heading" style={{ fontSize: '1.05rem', marginBottom: 'var(--space-3)' }}>
            What you need
          </h2>
          <ul className="materials-list">
            {rewrite.materials.map((m, i) => (
              <li key={i}>
                <strong>{m.label}</strong>
                {m.note && <span>{m.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="ghost" onClick={onRefresh}>
        Rewrite this again
      </Button>
    </>
  )
}

function PlainRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="plain-card__row">
      <span className="plain-card__row-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5 9.5 17 19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <p className="plain-card__row-label">{label}</p>
        <p className="plain-card__row-value">{value}</p>
      </div>
    </div>
  )
}

function OriginalView({ item }: { item: CourseWork }) {
  return (
    <div className="original-text">
      {item.description.trim() || 'Your teacher did not add a description to this assignment.'}
    </div>
  )
}
