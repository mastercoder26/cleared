import type { CrunchInsight } from './planMath'
import { formatDayLabel, humanizeMinutes } from './planMath'
import './plan.css'

/** The one-sentence takeaway from the week — deliberately calm, never alarmed. */
export function CrunchCallout({ insight }: { insight: CrunchInsight | null }) {
  if (!insight) {
    return (
      <p className="plan-crunch plan-crunch--calm">
        No day this stretch looks overloaded. Nice and even.
      </p>
    )
  }

  const heavyLabel = formatDayLabel(insight.heaviest.date)
  const minutes = humanizeMinutes(insight.heaviest.estimatedMinutes)

  return (
    <p className="plan-crunch">
      <strong>{heavyLabel.weekday}</strong> is the heaviest day — {insight.heaviest.dueCount} thing
      {insight.heaviest.dueCount === 1 ? '' : 's'} due, {minutes} of work.
      {insight.followedByClearDay && (
        <>
          {' '}
          {formatDayLabel(insight.followedByClearDay.date).weekday} right after is clear — starting some of{' '}
          {heavyLabel.weekday}'s work earlier could take the edge off.
        </>
      )}
    </p>
  )
}
