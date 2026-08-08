/** Shared "how urgent is this" logic so every card/badge agrees with the detail page. */
export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export function dueUrgency(dueAt: string | null): Urgency {
  if (!dueAt) return 'none'
  const diffMs = new Date(dueAt).getTime() - Date.now()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 0) return 'overdue'
  if (diffHours < 24) return 'today'
  if (diffHours < 24 * 4) return 'soon'
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

export function relativeDue(dueAt: string | null): string {
  if (!dueAt) return ''
  const diffMs = new Date(dueAt).getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const hours = Math.round(abs / (1000 * 60 * 60))
  const past = diffMs < 0

  if (hours < 1) return past ? 'Just passed' : 'Due within the hour'
  if (hours < 24) return `${past ? '' : 'in '}${hours}h${past ? ' ago' : ''}`
  const days = Math.round(hours / 24)
  return `${past ? '' : 'in '}${days} day${days === 1 ? '' : 's'}${past ? ' ago' : ''}`
}
