import { Link } from 'react-router-dom'
import type { TodoItem } from '../../lib/types'
import { dueUrgency, formatDue, relativeDue } from '../../lib/due'
import { useSettings } from '../../lib/settings'
import './today.css'

interface Group {
  label: string
  items: TodoItem[]
}

/** Groups by urgency (due sort) or by class (class sort) — whichever the person picked in feed prefs. */
function groupItems(items: TodoItem[], sort: 'due' | 'class'): Group[] {
  if (sort === 'class') {
    const byCourse = new Map<string, TodoItem[]>()
    for (const item of items) {
      const list = byCourse.get(item.courseName) ?? []
      list.push(item)
      byCourse.set(item.courseName, list)
    }
    return [...byCourse.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, groupItems]) => ({ label, items: groupItems }))
  }

  const buckets: Record<string, TodoItem[]> = { Overdue: [], 'Due today': [], 'Due this week': [], Later: [], 'No due date': [] }
  for (const item of items) {
    const urgency = dueUrgency(item.dueAt)
    if (urgency === 'overdue') buckets.Overdue.push(item)
    else if (urgency === 'today') buckets['Due today'].push(item)
    else if (urgency === 'soon') buckets['Due this week'].push(item)
    else if (urgency === 'later') buckets.Later.push(item)
    else buckets['No due date'].push(item)
  }
  return Object.entries(buckets)
    .filter(([, groupItems]) => groupItems.length > 0)
    .map(([label, groupItems]) => ({ label, items: groupItems }))
}

export function TodoList({ items }: { items: TodoItem[] }) {
  const { settings, toggleDismissed } = useSettings()
  const groups = groupItems(items, settings.todoSort)

  if (items.length === 0) {
    return (
      <div className="todo-empty">
        <p className="todo-empty__title">Nothing outstanding.</p>
        <p>Everything visible in your feed is either turned in or hidden. Nice.</p>
      </div>
    )
  }

  return (
    <div className="todo-groups">
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`todo-group-${group.label}`}>
          <h3 id={`todo-group-${group.label}`} className="todo-group__label" data-emphasis={group.label === 'Overdue' || group.label === 'Due today'}>
            {group.label}
            <span className="todo-group__count">{group.items.length}</span>
          </h3>
          <ul className="todo-list">
            {group.items.map((item) => (
              <TodoRow key={item.id} item={item} onDismiss={() => toggleDismissed(item.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function TodoRow({ item, onDismiss }: { item: TodoItem; onDismiss: () => void }) {
  const urgency = dueUrgency(item.dueAt)
  const done = item.submissionState === 'TURNED_IN' || item.submissionState === 'RETURNED'

  return (
    <li className="todo-row" data-urgency={urgency}>
      <Link to={`/courses/${item.courseId}/coursework/${item.id}`} className="todo-row__main">
        <span className="todo-row__course">{item.courseName}</span>
        <span className="todo-row__title">{item.title}</span>
        <span className="todo-row__due">
          {formatDue(item.dueAt)}
          {item.dueAt && !done && <span className="todo-row__relative"> · {relativeDue(item.dueAt)}</span>}
        </span>
      </Link>
      <button
        type="button"
        className="todo-row__dismiss"
        onClick={onDismiss}
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
    </li>
  )
}
