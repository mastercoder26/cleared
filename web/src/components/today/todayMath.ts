import { dueUrgency } from '../../lib/due'
import type { ProgressMap, TodoItem, WorkStatus } from '../../lib/types'

/** Everything the Today page needs to know about one row, computed once. */
export interface RankedItem {
  item: TodoItem
  status: WorkStatus
  isStuck: boolean
  isDone: boolean
  /** Lower sorts first — used for both group order and the "next thing" pick. */
  priority: number
}

const GROUP_ORDER = ['Stuck', 'Overdue', 'Due today', 'Due this week', 'Later', 'No due date'] as const
export type GroupLabel = (typeof GROUP_ORDER)[number]

export interface TodoGroup {
  label: GroupLabel
  items: RankedItem[]
}

function statusOf(progress: ProgressMap, workId: string): WorkStatus {
  return progress[workId]?.status ?? 'not-started'
}

/** Lower is more urgent. Stuck work and overdue work dominate everything else. */
function priorityOf(item: TodoItem, status: WorkStatus): number {
  const urgency = dueUrgency(item.dueAt)
  if (status === 'stuck') return 0
  if (urgency === 'overdue') return 1
  if (urgency === 'today') return 2
  if (status === 'in-progress') return 3
  if (urgency === 'soon') return 4
  if (urgency === 'later') return 5
  return 6
}

function isSubmitted(item: TodoItem): boolean {
  return item.submissionState === 'TURNED_IN' || item.submissionState === 'RETURNED'
}

export function rankItems(items: TodoItem[], progress: ProgressMap): RankedItem[] {
  return items.map((item) => {
    const status = statusOf(progress, item.id)
    return {
      item,
      status,
      isStuck: status === 'stuck',
      isDone: status === 'done' || isSubmitted(item),
      priority: priorityOf(item, status),
    }
  })
}

/** The single most important thing to work on right now, or null if the feed is clear. */
export function pickNextThing(ranked: RankedItem[]): RankedItem | null {
  const candidates = ranked.filter((r) => !r.isDone)
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const aTime = a.item.dueAt ? new Date(a.item.dueAt).getTime() : Infinity
    const bTime = b.item.dueAt ? new Date(b.item.dueAt).getTime() : Infinity
    return aTime - bTime
  })[0]
}

/** Groups by meaning. Stuck work is pulled out of its due-date bucket and pinned first. */
export function groupByMeaning(ranked: RankedItem[]): TodoGroup[] {
  const buckets: Record<GroupLabel, RankedItem[]> = {
    Stuck: [],
    Overdue: [],
    'Due today': [],
    'Due this week': [],
    Later: [],
    'No due date': [],
  }

  for (const entry of ranked) {
    if (entry.isStuck) {
      buckets.Stuck.push(entry)
      continue
    }
    const urgency = dueUrgency(entry.item.dueAt)
    if (urgency === 'overdue') buckets.Overdue.push(entry)
    else if (urgency === 'today') buckets['Due today'].push(entry)
    else if (urgency === 'soon') buckets['Due this week'].push(entry)
    else if (urgency === 'later') buckets.Later.push(entry)
    else buckets['No due date'].push(entry)
  }

  return GROUP_ORDER.filter((label) => buckets[label].length > 0).map((label) => ({
    label,
    items: buckets[label],
  }))
}

/** By class, for the "group by class" preference — stuck items still get no special pinning here. */
export function groupByClass(ranked: RankedItem[]): TodoGroup[] {
  const byCourse = new Map<string, RankedItem[]>()
  for (const entry of ranked) {
    const list = byCourse.get(entry.item.courseName) ?? []
    list.push(entry)
    byCourse.set(entry.item.courseName, list)
  }
  return [...byCourse.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label: label as GroupLabel, items }))
}
