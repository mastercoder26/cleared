import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Course, CourseWork } from '../lib/types'
import { AssignmentCard } from '../components/assignment/AssignmentCard'
import { StateBlock } from '../components/ui/StateBlock'

export function CourseWorkPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [items, setItems] = useState<CourseWork[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    setItems(null)
    setError(null)

    Promise.all([api.courses(), api.courseWork(courseId)])
      .then(([coursesRes, workRes]) => {
        if (cancelled) return
        setCourse(coursesRes.courses.find((c) => c.id === courseId) ?? null)
        setItems(workRes.courseWork)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this class.')
      })

    return () => {
      cancelled = true
    }
  }, [courseId])

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
        <div className="assignment-list">
          {items.map((w) => (
            <AssignmentCard key={w.id} item={w} />
          ))}
        </div>
      )}
    </div>
  )
}
