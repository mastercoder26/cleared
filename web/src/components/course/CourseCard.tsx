import { Link } from 'react-router-dom'
import type { Course } from '../../lib/types'
import { formatDue } from '../../lib/due'
import type { CourseStats } from './courseStats'
import './course.css'

interface Props {
  course: Course
  stats?: CourseStats
}

export function CourseCard({ course, stats }: Props) {
  const progressPct = stats && stats.totalCount > 0 ? Math.round((stats.doneCount / stats.totalCount) * 100) : null

  return (
    <Link to={`/courses/${course.id}`} className="course-card">
      <span className="course-card__initial" aria-hidden="true">
        {course.name.charAt(0)}
      </span>
      <span className="course-card__body">
        <span className="course-card__name">{course.name}</span>
        <span className="course-card__meta">
          {[course.section, course.room].filter(Boolean).join(' · ') || 'No section listed'}
        </span>

        {stats && (
          <span className="course-card__stats">
            {stats.stuckCount > 0 && (
              <span className="course-card__pill course-card__pill--stuck">
                {stats.stuckCount} stuck
              </span>
            )}
            <span className="course-card__pill">
              {stats.outstandingCount === 0 ? 'All caught up' : `${stats.outstandingCount} outstanding`}
            </span>
            {stats.nextDue && <span className="course-card__next-due">Next: {formatDue(stats.nextDue.dueAt)}</span>}
          </span>
        )}

        {progressPct !== null && stats && stats.totalCount > 0 && (
          <span className="course-card__progress" role="img" aria-label={`${progressPct}% turned in or done`}>
            <span className="course-card__progress-fill" style={{ width: `${progressPct}%` }} />
          </span>
        )}
      </span>
      <svg className="course-card__chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
