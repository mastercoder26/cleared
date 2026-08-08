import { dueUrgency } from '../../lib/due'
import type { CourseWork, ProgressMap, TodoItem } from '../../lib/types'

export interface CourseStats {
  totalCount: number
  outstandingCount: number
  stuckCount: number
  doneCount: number
  nextDue: TodoItem | null
}

function isSubmitted(item: { submissionState: TodoItem['submissionState'] }): boolean {
  return item.submissionState === 'TURNED_IN' || item.submissionState === 'RETURNED'
}

/** One pass over the to-do list, bucketed per course — used by the courses grid. */
export function buildCourseStats(items: TodoItem[], progress: ProgressMap): Map<string, CourseStats> {
  const stats = new Map<string, CourseStats>()

  for (const item of items) {
    const existing = stats.get(item.courseId) ?? {
      totalCount: 0,
      outstandingCount: 0,
      stuckCount: 0,
      doneCount: 0,
      nextDue: null,
    }

    const status = progress[item.id]?.status ?? 'not-started'
    const done = status === 'done' || isSubmitted(item)

    const isEarlierDue =
      !existing.nextDue ||
      (item.dueAt && (!existing.nextDue.dueAt || new Date(item.dueAt) < new Date(existing.nextDue.dueAt)))

    stats.set(item.courseId, {
      totalCount: existing.totalCount + 1,
      outstandingCount: existing.outstandingCount + (done ? 0 : 1),
      stuckCount: existing.stuckCount + (status === 'stuck' ? 1 : 0),
      doneCount: existing.doneCount + (done ? 1 : 0),
      nextDue: !done && isEarlierDue ? item : existing.nextDue,
    })
  }

  return stats
}

/** Same idea, scoped to one course's coursework list — used by the coursework filter bar. */
export function statusOfWork(work: CourseWork, progress: ProgressMap): 'overdue' | 'due-soon' | 'in-progress' | 'stuck' | 'done' | 'not-started' {
  const entry = progress[work.id]
  const status = entry?.status ?? 'not-started'
  if (status === 'done' || isSubmitted(work)) return 'done'
  if (status === 'stuck') return 'stuck'
  if (status === 'in-progress') return 'in-progress'
  const urgency = dueUrgency(work.dueAt)
  if (urgency === 'overdue') return 'overdue'
  if (urgency === 'today' || urgency === 'soon') return 'due-soon'
  return 'not-started'
}
