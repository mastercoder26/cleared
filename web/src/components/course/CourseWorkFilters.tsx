import './course.css'

export type WorkFilter = 'all' | 'overdue' | 'due-soon' | 'in-progress' | 'stuck' | 'done'

const FILTER_LABEL: Record<WorkFilter, string> = {
  all: 'All',
  overdue: 'Overdue',
  'due-soon': 'Due soon',
  'in-progress': 'In progress',
  stuck: 'Stuck',
  done: 'Done',
}

interface Props {
  active: WorkFilter
  onChange: (filter: WorkFilter) => void
  counts: Record<WorkFilter, number>
}

/** Status filter bar for a class's coursework list — counts keep it scannable at a glance. */
export function CourseWorkFilters({ active, onChange, counts }: Props) {
  const filters = Object.keys(FILTER_LABEL) as WorkFilter[]

  return (
    <div className="coursework-filters" role="group" aria-label="Filter by status">
      {filters.map((filter) => {
        const count = counts[filter]
        if (filter !== 'all' && count === 0) return null
        return (
          <button
            key={filter}
            type="button"
            className="coursework-filters__btn"
            aria-pressed={active === filter}
            onClick={() => onChange(filter)}
          >
            {FILTER_LABEL[filter]}
            <span className="coursework-filters__count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
