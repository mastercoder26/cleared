/** Shared "how urgent is this" logic so every card/badge agrees with the detail page. */
export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'none'

const HOUR_MS = 1000 * 60 * 60
const DAY_MS = HOUR_MS * 24

/** "Soon" is the next four days — far enough to plan, close enough to matter. */
const SOON_DAYS = 4

export function dueUrgency(dueAt: string | null): Urgency {
  if (!dueAt) return 'none'
  const diffHours = (new Date(dueAt).getTime() - Date.now()) / HOUR_MS
  if (diffHours < 0) return 'overdue'
  if (diffHours < 24) return 'today'
  if (diffHours < 24 * SOON_DAYS) return 'soon'
  return 'later'
}

export function formatDue(dueAt: string | null): string {
  if (!dueAt) return 'No due date'
  const d = new Date(dueAt)
  const now = new Date()
  const isThisYear = d.getFullYear() === now.getFullYear()
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: isThisYear ? undefined : 'numeric',
  })
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `Due ${datePart}, ${timePart}`
}

/**
 * Whole calendar days between two instants, ignoring clock time.
 *
 * This is deliberately not `diffMs / DAY_MS`. If it's 11pm Monday and something
 * is due 9am Tuesday, that's 10 hours — but the reader has to hand it in
 * *tomorrow*, and calling it "in 0 days" is the kind of thing that loses
 * someone a grade. Calendar boundaries are what people actually plan against.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS)
}

/**
 * Short relative phrasing for a due date, e.g. "tomorrow", "in 3 days",
 * "2 days ago". Returns '' when there is no due date so callers can render
 * nothing without a special case.
 */
export function relativeDue(dueAt: string | null): string {
  if (!dueAt) return ''

  const due = new Date(dueAt)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const past = diffMs < 0
  const days = calendarDaysBetween(now, due)

  // Inside the same calendar day, hours read more usefully than "today".
  if (days === 0) {
    const hours = Math.floor(Math.abs(diffMs) / HOUR_MS)
    if (hours < 1) {
      const minutes = Math.max(1, Math.round(Math.abs(diffMs) / 60_000))
      return past ? `${minutes} min ago` : `in ${minutes} min`
    }
    return past ? `${hours}h ago` : `in ${hours}h`
  }

  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'

  const magnitude = Math.abs(days)
  return past ? `${magnitude} days ago` : `in ${magnitude} days`
}

/**
 * The bucket a due date belongs to in a grouped list. Kept here rather than in
 * a view so the Today feed, the week view, and the course pages can never
 * disagree about what "this week" means.
 */
export type DueGroup = 'overdue' | 'today' | 'tomorrow' | 'this-week' | 'later' | 'no-date'

export function dueGroup(dueAt: string | null): DueGroup {
  if (!dueAt) return 'no-date'
  const days = calendarDaysBetween(new Date(), new Date(dueAt))
  if (new Date(dueAt).getTime() < Date.now()) return 'overdue'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 7) return 'this-week'
  return 'later'
}

export const DUE_GROUP_LABELS: Record<DueGroup, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  tomorrow: 'Due tomorrow',
  'this-week': 'This week',
  later: 'Later',
  'no-date': 'No due date',
}

/** Minutes rendered the way a person says them: "about 2 hours", not "127". */
export function humanMinutes(minutes: number): string {
  if (minutes <= 0) return 'nothing'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  if (rest < 15) return `about ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  if (rest < 45) return `about ${hours}½ hours`
  return `about ${hours + 1} hours`
}
