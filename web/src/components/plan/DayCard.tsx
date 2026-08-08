import { Link } from 'react-router-dom'
import type { WorkloadDay } from '../../lib/types'
import { formatDayLabel, humanizeMinutes } from './planMath'
import './plan.css'

const LOAD_LABEL: Record<WorkloadDay['load'], string> = {
  clear: 'Clear',
  light: 'Light',
  busy: 'Busy',
  heavy: 'Heavy',
}

/**
 * One day in the week view. Load is shown as a text label plus a patterned
 * bar (not just a color) so it still reads in grayscale or high contrast.
 */
export function DayCard({ day }: { day: WorkloadDay }) {
  const { weekday, monthDay, isToday } = formatDayLabel(day.date)
  const summary =
    day.dueCount === 0
      ? 'Nothing due'
      : `${day.dueCount} thing${day.dueCount === 1 ? '' : 's'} due · ${humanizeMinutes(day.estimatedMinutes)}`

  return (
    <li className="plan-day" data-load={day.load} data-today={isToday || undefined}>
      <div className="plan-day__head">
        <span className="plan-day__weekday">{weekday}</span>
        <span className="plan-day__date">{monthDay}</span>
        {isToday && <span className="plan-day__today-badge">Today</span>}
      </div>

      <div className="plan-day__load-bar" aria-hidden="true" />
      <p className="plan-day__load-label">{LOAD_LABEL[day.load]}</p>
      <p className="plan-day__summary">{summary}</p>

      {day.items.length > 0 && (
        <ul className="plan-day__items">
          {day.items.map((item) => (
            <li key={item.id} className="plan-day__item">
              <Link to={`/courses/${item.courseId}/coursework/${item.id}`} className="plan-day__item-link">
                <span className="plan-day__item-course">{item.courseName}</span>
                <span className="plan-day__item-title">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
