import { Link } from 'react-router-dom'
import type { CourseWork, ProgressMap } from '../../lib/types'
import { dueUrgency, formatDue, relativeDue } from '../../lib/due'
import { statusOfWork } from './courseStats'
import './course.css'

const STATUS_BADGE: Partial<Record<ReturnType<typeof statusOfWork>, { label: string; variant: string }>> = {
  overdue: { label: 'Overdue', variant: 'danger' },
  'due-soon': { label: 'Due soon', variant: 'warn' },
  'in-progress': { label: 'In progress', variant: 'accent' },
  stuck: { label: 'Stuck', variant: 'warn' },
  done: { label: 'Done', variant: 'good' },
}

export function CourseWorkCard({ item, progress }: { item: CourseWork; progress: ProgressMap }) {
  const urgency = dueUrgency(item.dueAt)
  const status = statusOfWork(item, progress)
  const badge = STATUS_BADGE[status]

  return (
    <Link to={`/courses/${item.courseId}/coursework/${item.id}`} className="coursework-card" data-urgency={urgency}>
      <div className="coursework-card__top">
        <h3 className="coursework-card__title">{item.title}</h3>
        {badge && <span className={`badge badge--${badge.variant}`}>{badge.label}</span>}
      </div>

      <p className="coursework-card__due">
        {formatDue(item.dueAt)}
        {item.dueAt && status !== 'done' && <span className="coursework-card__relative"> · {relativeDue(item.dueAt)}</span>}
      </p>

      <p className="coursework-card__snippet">{firstLine(item.description)}</p>

      <span className="coursework-card__cta">
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
