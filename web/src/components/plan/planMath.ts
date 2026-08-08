import { api } from '../../lib/api'
import type { LoadLevel, TodoItem, WorkloadDay } from '../../lib/types'

const DAY_MS = 24 * 60 * 60 * 1000
/** Rough per-item estimate used only when the server workload endpoint is unavailable. */
const FALLBACK_MINUTES_PER_ITEM = 30

const LOAD_RANK: Record<LoadLevel, number> = { clear: 0, light: 1, busy: 2, heavy: 3 }

export function loadRank(level: LoadLevel): number {
  return LOAD_RANK[level]
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function loadForCount(count: number): LoadLevel {
  if (count === 0) return 'clear'
  if (count === 1) return 'light'
  if (count <= 3) return 'busy'
  return 'heavy'
}

/**
 * Builds the same shape the server would, from the plain to-do list, for when
 * `/api/workload` isn't up yet or errors. Minutes are a flat guess per item —
 * clearly rougher than the server's estimate, but enough to show the shape
 * of the week rather than nothing at all.
 */
function buildFallbackDays(items: TodoItem[], days: number): WorkloadDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const byDate = new Map<string, TodoItem[]>()
  for (const item of items) {
    if (!item.dueAt) continue
    const key = dateKey(new Date(item.dueAt))
    const list = byDate.get(key) ?? []
    list.push(item)
    byDate.set(key, list)
  }

  const result: WorkloadDay[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(today.getTime() + i * DAY_MS)
    const key = dateKey(date)
    const dayItems = byDate.get(key) ?? []
    result.push({
      date: key,
      dueCount: dayItems.length,
      estimatedMinutes: dayItems.length * FALLBACK_MINUTES_PER_ITEM,
      load: loadForCount(dayItems.length),
      items: dayItems.map((item) => ({
        id: item.id,
        courseId: item.courseId,
        courseName: item.courseName,
        title: item.title,
        dueAt: item.dueAt,
        estimatedMinutes: FALLBACK_MINUTES_PER_ITEM,
      })),
    })
  }
  return result
}

export interface WorkloadResult {
  days: WorkloadDay[]
  /** True when this came from the client-side fallback rather than the server. */
  isFallback: boolean
}

/** Tries the real workload endpoint first; degrades to a client-computed estimate rather than failing. */
export async function loadWorkload(days: number): Promise<WorkloadResult> {
  try {
    const res = await api.workload(days)
    return { days: res.days, isFallback: false }
  } catch {
    const todo = await api.todo()
    return { days: buildFallbackDays(todo.items, days), isFallback: true }
  }
}

export function humanizeMinutes(minutes: number): string {
  if (minutes <= 0) return 'nothing scheduled'
  if (minutes < 60) return `about ${minutes} min`
  const hours = minutes / 60
  const rounded = Math.round(hours * 2) / 2
  const label = rounded === 1 ? 'hour' : 'hours'
  return `about ${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${label}`
}

export interface CrunchInsight {
  heaviest: WorkloadDay
  /** The day right after the heaviest one, when it's clear — the "move something earlier" case. */
  followedByClearDay: WorkloadDay | null
}

/** Surfaces the one thing worth saying about the week: where's the spike, and is there slack nearby. */
export function findCrunch(days: WorkloadDay[]): CrunchInsight | null {
  if (days.length === 0) return null
  const heaviest = days.reduce((max, d) => (loadRank(d.load) > loadRank(max.load) ? d : max), days[0])
  if (loadRank(heaviest.load) < loadRank('busy')) return null

  const index = days.indexOf(heaviest)
  const next = days[index + 1]
  const followedByClearDay = next && next.load === 'clear' ? next : null

  return { heaviest, followedByClearDay }
}

export function formatDayLabel(dateStr: string): { weekday: string; monthDay: string; isToday: boolean } {
  const date = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  const isToday = dateKey(date) === dateKey(today)
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday,
  }
}
