import { Link } from 'react-router-dom'
import type { TodoItem, WorkStatus } from '../../lib/types'
import { dueUrgency, formatDue, relativeDue } from '../../lib/due'
import { useSettings } from '../../lib/settings'
import { groupByClass, groupByMeaning, type RankedItem, type TodoGroup } from './todayMath'
import { StatusControl } from './StatusControl'
import './today.css'

/** Groups longer than this collapse behind a "Show more" button by default. */
const DEFAULT_VISIBLE_PER_GROUP = 5

interface Props {
  ranked: RankedItem[]
  collapsedGroups: string[]
  onToggleCollapse: (label: string) => void
  expandedGroups: string[]
  onToggleExpand: (key: string) => void
  onStatusChange: (item: TodoItem, status: WorkStatus) => void
  onDismiss: (item: TodoItem) => void
}

export function TodoList({
  ranked,
  collapsedGroups,
  onToggleCollapse,
  expandedGroups,
  onToggleExpand,
  onStatusChange,
  onDismiss,
}: Props) {
  const { settings } = useSettings()
  const groups: TodoGroup[] = settings.todoSort === 'class' ? groupByClass(ranked) : groupByMeaning(ranked)

  if (ranked.length === 0) {
    return (
      <div className="todo-empty">
        <p className="todo-empty__title">Nothing outstanding.</p>
        <p>Everything visible in your feed is either done or hidden. Nice.</p>
      </div>
    )
  }

  return (
    <div className="todo-groups">
      {groups.map((group) => (
        <TodoGroupSection
          key={group.label}
          group={group}
          collapsed={collapsedGroups.includes(group.label)}
          onToggleCollapse={() => onToggleCollapse(group.label)}
          expanded={expandedGroups.includes(group.label)}
          onToggleExpand={() => onToggleExpand(group.label)}
          onStatusChange={onStatusChange}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

function TodoGroupSection({
  group,
  collapsed,
  onToggleCollapse,
  expanded,
  onToggleExpand,
  onStatusChange,
  onDismiss,
}: {
  group: TodoGroup
  collapsed: boolean
  onToggleCollapse: () => void
  expanded: boolean
  onToggleExpand: () => void
  onStatusChange: (item: TodoItem, status: WorkStatus) => void
  onDismiss: (item: TodoItem) => void
}) {
  const headingId = `todo-group-${group.label.replace(/\s+/g, '-')}`
  const visible = expanded ? group.items : group.items.slice(0, DEFAULT_VISIBLE_PER_GROUP)
  const hiddenCount = group.items.length - visible.length

  return (
    <section aria-labelledby={headingId}>
      <button
        type="button"
        className="todo-group__toggle"
        aria-expanded={!collapsed}
        onClick={onToggleCollapse}
      >
        <h3 id={headingId} className="todo-group__label" data-emphasis={group.label === 'Stuck' || group.label === 'Overdue' || group.label === 'Due today'}>
          <svg
            className="todo-group__chevron"
            data-collapsed={collapsed}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {group.label}
          <span className="todo-group__count">{group.items.length}</span>
        </h3>
      </button>

      {!collapsed && (
        <>
          <ul className="todo-list">
            {visible.map((entry) => (
              <TodoRow
                key={entry.item.id}
                entry={entry}
                onStatusChange={onStatusChange}
                onDismiss={onDismiss}
              />
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button type="button" className="todo-group__more" onClick={onToggleExpand}>
              Show {hiddenCount} more
            </button>
          )}
          {expanded && group.items.length > DEFAULT_VISIBLE_PER_GROUP && (
            <button type="button" className="todo-group__more" onClick={onToggleExpand}>
              Show fewer
            </button>
          )}
        </>
      )}
    </section>
  )
}

function TodoRow({
  entry,
  onStatusChange,
  onDismiss,
}: {
  entry: RankedItem
  onStatusChange: (item: TodoItem, status: WorkStatus) => void
  onDismiss: (item: TodoItem) => void
}) {
  const { item, status, isDone } = entry
  const urgency = dueUrgency(item.dueAt)

  return (
    <li className="todo-row" data-urgency={urgency}>
      <Link to={`/courses/${item.courseId}/coursework/${item.id}`} className="todo-row__main">
        <span className="todo-row__course">{item.courseName}</span>
        <span className="todo-row__title">{item.title}</span>
        <span className="todo-row__due">
          {formatDue(item.dueAt)}
          {item.dueAt && !isDone && <span className="todo-row__relative"> · {relativeDue(item.dueAt)}</span>}
        </span>
      </Link>

      <div className="todo-row__actions">
        <StatusControl itemTitle={item.title} status={status} onChange={(next) => onStatusChange(item, next)} />
        <button
          type="button"
          className="todo-row__dismiss"
          onClick={() => onDismiss(item)}
          title="Hide from your Today list only — this doesn't change anything in Classroom"
          aria-label={`Hide "${item.title}" from your Today list. This only affects cleared, not Classroom.`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3l18 18M10.7 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 3.5 10 7-.5 1.1-1.2 2.2-2.1 3.1M6.5 6.6C4.6 7.9 3.1 9.7 2 12c1.5 3.5 5 7 10 7 1.3 0 2.5-.2 3.6-.6M9.9 10a3 3 0 0 0 4.2 4.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="todo-row__dismiss-label">Hide</span>
        </button>
      </div>
    </li>
  )
}
