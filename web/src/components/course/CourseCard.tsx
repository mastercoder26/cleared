import { Link } from 'react-router-dom'
import type { Course } from '../../lib/types'
import './course.css'

export function CourseCard({ course }: { course: Course }) {
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
      </span>
      <svg className="course-card__chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
