import { Link } from 'react-router-dom'
import type { CourseWork } from '../../lib/types'
import { dueUrgency, formatDue, relativeDue } from '../../lib/due'
import './assignment.css'

export function AssignmentCard({ item }: { item: CourseWork }) {
  const urgency = dueUrgency(item.dueAt)
  const done = item.submissionState === 'TURNED_IN' || item.submissionState === 'RETURNED'

  return (
    <Link to={`/courses/${item.courseId}/coursework/${item.id}`} className="assignment-card" data-urgency={urgency}>
      <div className="assignment-card__top">
        <h3 className="assignment-card__title">{item.title}</h3>
        {done ? (
          <span className="badge badge--good">Turned in</span>
        ) : urgency === 'overdue' ? (
          <span className="badge badge--danger">Overdue</span>
        ) : urgency === 'today' ? (
          <span className="badge badge--warn">Due today</span>
        ) : null}
      </div>

      <p className="assignment-card__due">
        {formatDue(item.dueAt)}
        {item.dueAt && !done && <span className="assignment-card__relative"> · {relativeDue(item.dueAt)}</span>}
      </p>

      <p className="assignment-card__snippet">{firstLine(item.description)}</p>

      <span className="assignment-card__cta">
        See it in plain words
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}

function firstLine(text: string): string {
  if (!text.trim()) return 'No description from your teacher.'
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean
}
