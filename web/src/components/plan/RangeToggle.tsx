import type { PlanRangeDays } from '../../lib/feedPrefs'
import './plan.css'

interface Props {
  value: PlanRangeDays
  onChange: (days: PlanRangeDays) => void
}

export function RangeToggle({ value, onChange }: Props) {
  return (
    <div className="plan-range" role="group" aria-label="Days to show">
      {([7, 14] as PlanRangeDays[]).map((days) => (
        <button
          key={days}
          type="button"
          className="plan-range__btn"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
        >
          {days} days
        </button>
      ))}
    </div>
  )
}
