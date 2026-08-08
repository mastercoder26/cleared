import type { WorkStatus } from '../../lib/types'
import type { SyncState } from '../../lib/progress'
import { SYNC_MESSAGES } from '../../lib/progress'

const STATUSES: { value: WorkStatus; label: string }[] = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'stuck', label: 'Stuck' },
  { value: 'done', label: 'Done' },
]

/** "Where am I on this?" — the single control the whole page hangs off of. */
export function StatusControl({
  status,
  syncState,
  onChange,
}: {
  status: WorkStatus
  syncState: SyncState
  onChange: (status: WorkStatus) => void
}) {
  const syncMessage = SYNC_MESSAGES[syncState]

  return (
    <div className="status-control">
      <div className="status-control__buttons" role="radiogroup" aria-label="Assignment status">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={status === s.value}
            className="status-control__btn"
            data-status={s.value}
            data-active={status === s.value}
            onClick={() => onChange(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {syncMessage && (
        <p className="status-control__sync" data-state={syncState} role="status">
          {syncMessage}
        </p>
      )}
    </div>
  )
}
