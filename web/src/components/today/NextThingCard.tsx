import { Link } from 'react-router-dom'
import type { RankedItem } from './todayMath'
import { formatDue, relativeDue } from '../../lib/due'
import './today.css'

const STATUS_NOTE: Record<string, string> = {
  stuck: "You marked this stuck — that's exactly why it's first.",
  'in-progress': "You're partway through this one already.",
}

/** The single recommended thing to work on. One item, not a ranked list — that's the point. */
export function NextThingCard({ ranked }: { ranked: RankedItem | null }) {
  if (!ranked) {
    return (
      <section className="next-thing next-thing--clear" aria-label="What to do next">
        <p className="next-thing__eyebrow">Next up</p>
        <p className="next-thing__clear-title">Nothing needs you right now.</p>
        <p className="next-thing__clear-detail">Everything in your feed is done, dismissed, or hidden. Enjoy the gap.</p>
      </section>
    )
  }

  const { item, status } = ranked
  const note = STATUS_NOTE[status]

  return (
    <section className="next-thing" aria-label="What to do next">
      <p className="next-thing__eyebrow">Next up</p>
      <p className="next-thing__course">{item.courseName}</p>
      <h2 className="next-thing__title">{item.title}</h2>
      <p className="next-thing__due">
        {formatDue(item.dueAt)}
        {item.dueAt && <span className="next-thing__relative"> · {relativeDue(item.dueAt)}</span>}
      </p>
      {note && <p className="next-thing__note">{note}</p>}
      <Link to={`/focus/${item.courseId}/${item.id}`} className="btn btn--primary next-thing__cta">
        Start working
      </Link>
    </section>
  )
}
