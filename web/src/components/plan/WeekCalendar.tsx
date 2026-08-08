import type { WorkloadDay } from '../../lib/types'
import { DayCard } from './DayCard'
import './plan.css'

/**
 * The calendar-shaped load grid. A real ordered list, top-to-bottom reading
 * order matches left-to-right/top-to-bottom visual order, so screen readers
 * get the days in date order regardless of the responsive layout.
 */
export function WeekCalendar({ days }: { days: WorkloadDay[] }) {
  return (
    <ol className="plan-grid" aria-label="Load by day">
      {days.map((day) => (
        <DayCard key={day.date} day={day} />
      ))}
    </ol>
  )
}
