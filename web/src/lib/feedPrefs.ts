import { useEffect, useState } from 'react'

/**
 * Small, local-only preferences for the orientation surfaces (Today / Plan /
 * Courses). Kept separate from `lib/settings.tsx` — that module is owned by
 * another workstream — but follows the same pattern: localStorage-backed,
 * merged over defaults so old/missing keys never crash a render.
 */

const STORAGE_KEY = 'cleared.feedPrefs.v1'

export type PlanRangeDays = 7 | 14

export interface FeedPrefs {
  /** Today-page group labels the student has collapsed (e.g. "Later"). */
  collapsedGroups: string[]
  /** How many days ahead the Plan week view shows. */
  planRangeDays: PlanRangeDays
  /** Course IDs a student has expanded past the default "show first N" cap. */
  expandedGroups: string[]
}

const DEFAULTS: FeedPrefs = {
  collapsedGroups: [],
  planRangeDays: 7,
  expandedGroups: [],
}

function loadPrefs(): FeedPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    // Private browsing, disabled storage, or corrupt JSON — fall back quietly.
    return DEFAULTS
  }
}

function persistPrefs(prefs: FeedPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Storage may be full or unavailable — preferences just won't survive reload.
  }
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function useFeedPrefs() {
  const [prefs, setPrefs] = useState<FeedPrefs>(loadPrefs)

  useEffect(() => persistPrefs(prefs), [prefs])

  const toggleGroupCollapsed = (label: string) =>
    setPrefs((p) => ({ ...p, collapsedGroups: toggleInList(p.collapsedGroups, label) }))

  const toggleGroupExpanded = (key: string) =>
    setPrefs((p) => ({ ...p, expandedGroups: toggleInList(p.expandedGroups, key) }))

  const setPlanRangeDays = (days: PlanRangeDays) => setPrefs((p) => ({ ...p, planRangeDays: days }))

  return { prefs, toggleGroupCollapsed, toggleGroupExpanded, setPlanRangeDays }
}
