const DONE_STATES = new Set(['TURNED_IN', 'RETURNED'])

// Minute-estimate heuristic. Most assignments don't have a rewrite yet, so
// this stands in until one exists — base minutes per work type, plus a bump
// for higher point values and longer descriptions.
const BASE_MINUTES_BY_WORK_TYPE = {
  ASSIGNMENT: 45,
  SHORT_ANSWER_QUESTION: 15,
  MULTIPLE_CHOICE_QUESTION: 10,
  QUIZ: 20,
}
const DEFAULT_BASE_MINUTES = 30

const HIGH_POINTS_THRESHOLD = 50
const HIGH_POINTS_BONUS_MINUTES = 30
const LOW_POINTS_THRESHOLD = 10
const LOW_POINTS_DISCOUNT_MINUTES = 10

const LONG_DESCRIPTION_CHARS = 800
const LONG_DESCRIPTION_BONUS_MINUTES = 20
const SHORT_DESCRIPTION_CHARS = 150
const SHORT_DESCRIPTION_DISCOUNT_MINUTES = 5

const MIN_ESTIMATE_MINUTES = 10

// Daily load thresholds, in total estimated minutes for the day.
const LOAD_LIGHT_MAX_MINUTES = 60
const LOAD_BUSY_MAX_MINUTES = 150

const isoDate = (date) => date.toISOString().slice(0, 10)

const todayAtMidnightUtc = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/** Rough, documented heuristic for how long an assignment will take, absent a rewrite. */
export function estimateMinutes(item) {
  let minutes = BASE_MINUTES_BY_WORK_TYPE[item.workType] ?? DEFAULT_BASE_MINUTES

  if (typeof item.maxPoints === 'number') {
    if (item.maxPoints >= HIGH_POINTS_THRESHOLD) minutes += HIGH_POINTS_BONUS_MINUTES
    else if (item.maxPoints <= LOW_POINTS_THRESHOLD) minutes -= LOW_POINTS_DISCOUNT_MINUTES
  }

  const descriptionLength = item.description?.length ?? 0
  if (descriptionLength >= LONG_DESCRIPTION_CHARS) minutes += LONG_DESCRIPTION_BONUS_MINUTES
  else if (descriptionLength <= SHORT_DESCRIPTION_CHARS) minutes -= SHORT_DESCRIPTION_DISCOUNT_MINUTES

  return Math.max(MIN_ESTIMATE_MINUTES, minutes)
}

const loadForMinutes = (minutes) => {
  if (minutes <= 0) return 'clear'
  if (minutes < LOAD_LIGHT_MAX_MINUTES) return 'light'
  if (minutes < LOAD_BUSY_MAX_MINUTES) return 'busy'
  return 'heavy'
}

/**
 * Buckets outstanding coursework into the next `days` calendar days, so gaps
 * (empty days) are as visible as the busy ones. Overdue items surface on
 * today rather than their original due date — the point is what's still
 * outstanding right now, not a stale calendar entry.
 */
export function buildWorkload(items, days) {
  const today = todayAtMidnightUtc()
  const buckets = new Map()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() + i)
    buckets.set(isoDate(date), [])
  }

  const todayKey = isoDate(today)
  const lastKey = isoDate(new Date(today.getTime() + (days - 1) * 86_400_000))

  for (const item of items) {
    if (DONE_STATES.has(item.submissionState)) continue
    if (!item.dueAt) continue

    const dueDate = new Date(item.dueAt)
    let key = isoDate(dueDate)
    if (key < todayKey) key = todayKey
    if (key > lastKey) continue
    if (!buckets.has(key)) continue

    buckets.get(key).push({
      id: item.id,
      courseId: item.courseId,
      courseName: item.courseName,
      title: item.title,
      dueAt: item.dueAt,
      estimatedMinutes: estimateMinutes(item),
    })
  }

  return [...buckets.entries()].map(([date, dayItems]) => {
    const estimatedMinutes = dayItems.reduce((sum, i) => sum + i.estimatedMinutes, 0)
    return {
      date,
      dueCount: dayItems.length,
      estimatedMinutes,
      load: loadForMinutes(estimatedMinutes),
      items: dayItems,
    }
  })
}
