import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Course } from '../lib/types'
import { CourseCard } from '../components/course/CourseCard'
import { StateBlock } from '../components/ui/StateBlock'

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .courses()
      .then((res) => {
        if (!cancelled) setCourses(res.courses)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load your classes.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1>Your classes</h1>
      <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        Pick a class to see what's assigned.
      </p>

      {error && <StateBlock kind="error" title="Couldn't load classes" detail={error} />}
      {!error && !courses && <StateBlock kind="loading" title="Loading your classes…" />}
      {!error && courses && courses.length === 0 && (
        <StateBlock kind="empty" title="No active classes found" detail="Nothing is showing up here yet." />
      )}
      {!error && courses && courses.length > 0 && (
        <div className="course-grid">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
