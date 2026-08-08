import type { WorkStatus } from '../../lib/types'
import './today.css'

const OPTIONS: { status: WorkStatus; label: string }[] = [
  { status: 'not-started', label: 'Not started' },
  { status: 'in-progress', label: 'In progress' },
  { status: 'stuck', label: 'Stuck' },
  { status: 'done', label: 'Done' },
]

interface Props {
  itemTitle: string
  status: WorkStatus
  onChange: (status: WorkStatus) => void
}

/** Quick status-set control on a Today row — writes to cleared's own progress store, never to Classroom. */
export function StatusControl({ itemTitle, status, onChange }: Props) {
  return (
    <div className="status-control" role="group" aria-label={`Update progress on ${itemTitle}`}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.status}
          type="button"
          className="status-control__btn"
          data-status={opt.status}
          aria-pressed={status === opt.status}
          onClick={() => onChange(opt.status)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
