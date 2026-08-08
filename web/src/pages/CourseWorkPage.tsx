import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Course, CourseWork, ProgressMap } from '../lib/types'
import { CourseWorkCard } from '../components/course/CourseWorkCard'
import { CourseWorkFilters, type WorkFilter } from '../components/course/CourseWorkFilters'
import { statusOfWork } from '../components/course/courseStats'
import { StateBlock } from '../components/ui/StateBlock'

export function CourseWorkPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [items, setItems] = useState<CourseWork[] | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<WorkFilter>('all')

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    setItems(null)
    setError(null)
    setFilter('all')

    Promise.all([api.courses(), api.courseWork(courseId)])
      .then(([coursesRes, workRes]) => {
        if (cancelled) return
        setCourse(coursesRes.courses.find((c) => c.id === courseId) ?? null)
        setItems(workRes.courseWork)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this class.')
      })

    api
      .progress()
      .then((res) => {
        if (!cancelled) setProgress(res.progress)
      })
      .catch(() => {
        if (!cancelled) setProgress({})
      })

    return () => {
      cancelled = true
    }
  }, [courseId])

  const counts = useMemo(() => {
    const base: Record<WorkFilter, number> = { all: 0, overdue: 0, 'due-soon': 0, 'in-progress': 0, stuck: 0, done: 0 }
    if (!items) return base
    for (const item of items) {
      base.all += 1
      const status = statusOfWork(item, progress)
      if (status === 'overdue' || status === 'due-soon' || status === 'in-progress' || status === 'stuck' || status === 'done') {
        base[status] += 1
      }
    }
    return base
  }, [items, progress])

  const filtered = useMemo(() => {
    if (!items) return []
    if (filter === 'all') return items
    return items.filter((item) => statusOfWork(item, progress) === filter)
  }, [items, progress, filter])

  return (
    <div>
      <Link to="/courses" className="detail-header__crumb">
        ← All classes
      </Link>
      <h1>{course?.name ?? 'Class'}</h1>
      {course && (
        <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {[course.section, course.room].filter(Boolean).join(' · ') || 'Assignments for this class'}
        </p>
      )}

      {error && <StateBlock kind="error" title="Couldn't load assignments" detail={error} />}
      {!error && !items && <StateBlock kind="loading" title="Loading assignments…" />}
      {!error && items && items.length === 0 && (
        <StateBlock kind="empty" title="Nothing assigned right now" detail="Check back later." />
      )}

      {!error && items && items.length > 0 && (
        <>
          <CourseWorkFilters active={filter} onChange={setFilter} counts={counts} />
          {filtered.length === 0 ? (
            <StateBlock kind="empty" title="Nothing matches this filter" detail="Try a different status above." />
          ) : (
            <div className="coursework-list">
              {filtered.map((w) => (
                <CourseWorkCard key={w.id} item={w} progress={progress} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
