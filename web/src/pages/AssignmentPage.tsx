import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Course, CourseWork, Rewrite } from '../lib/types'
import { formatDue } from '../lib/due'
import { StateBlock } from '../components/ui/StateBlock'
import { Button } from '../components/ui/Button'
import '../components/assignment/assignment.css'

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
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())

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
        setCheckedSteps(new Set())
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

  const toggleStep = (i: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
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

      {rewrite && !rewriteLoading && view === 'steps' && (
        <StepsView rewrite={rewrite} checked={checkedSteps} onToggle={toggleStep} />
      )}

      {view === 'original' && <OriginalView item={item} />}
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
  return (
    <>
      <div className="plain-card">
        <p className="plain-card__what">{rewrite.plain.whatToDo}</p>

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

function StepsView({
  rewrite,
  checked,
  onToggle,
}: {
  rewrite: Rewrite
  checked: Set<number>
  onToggle: (i: number) => void
}) {
  const totalMinutes = rewrite.steps.reduce((sum, s) => sum + s.minutes, 0)
  return (
    <>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 'var(--space-4)' }}>
        {rewrite.steps.length} steps · about {totalMinutes} minutes total. Check them off as you go.
      </p>
      <ol className="steps">
        {rewrite.steps.map((step, i) => (
          <li key={i} className="step" data-done={checked.has(i)}>
            <button
              type="button"
              className="step__check"
              aria-pressed={checked.has(i)}
              aria-label={`Mark step ${i + 1}, ${step.action}, as ${checked.has(i) ? 'not done' : 'done'}`}
              onClick={() => onToggle(i)}
            >
              {checked.has(i) ? '✓' : i + 1}
            </button>
            <div className="step__body">
              <p className="step__action">{step.action}</p>
              {step.detail && <p className="step__detail">{step.detail}</p>}
            </div>
            <span className="step__minutes">~{step.minutes} min</span>
          </li>
        ))}
      </ol>
    </>
  )
}

function OriginalView({ item }: { item: CourseWork }) {
  return (
    <div className="original-text">
      {item.description.trim() || 'Your teacher did not add a description to this assignment.'}
    </div>
  )
}
