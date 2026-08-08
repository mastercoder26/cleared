import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { useFeedPrefs } from '../lib/feedPrefs'
import type { Course, ProgressMap, TodoItem, WorkStatus } from '../lib/types'
import { DailySummaryCard } from '../components/today/DailySummaryCard'
import { TodoList } from '../components/today/TodoList'
import { NextThingCard } from '../components/today/NextThingCard'
import { FeedPreferencesPanel } from '../components/today/FeedPreferencesPanel'
import { UndoToast } from '../components/today/UndoToast'
import { rankItems, pickNextThing } from '../components/today/todayMath'
import { StateBlock } from '../components/ui/StateBlock'
import { Button } from '../components/ui/Button'

export function TodayPage() {
  const { me } = useAuth()
  const { settings, toggleDismissed } = useSettings()
  const { prefs, toggleGroupCollapsed, toggleGroupExpanded } = useFeedPrefs()
  const [courses, setCourses] = useState<Course[]>([])
  const [items, setItems] = useState<TodoItem[] | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [error, setError] = useState<string | null>(null)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [lastDismissed, setLastDismissed] = useState<TodoItem | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .todo()
      .then((res) => {
        if (cancelled) return
        setCourses(res.courses)
        setItems(res.items)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load your to-do list.')
      })

    // Progress is a "nice to have" enrichment — if it's unavailable, the page
    // still works, just without status badges and the next-thing rationale.
    api
      .progress()
      .then((res) => {
        if (!cancelled) setProgress(res.progress)
      })
      .catch(() => {
        if (!cancelled) setProgress({})
      })

    return () => {
      cancelled = true
    }
  }, [])

  const visibleItems = useMemo(() => {
    if (!items) return []
    return items.filter((item) => {
      if (settings.hiddenCourseIds.includes(item.courseId)) return false
      if (settings.dismissedWorkIds.includes(item.id)) return false
      if (settings.hideDoneInFeed && (item.submissionState === 'TURNED_IN' || item.submissionState === 'RETURNED')) {
        return false
      }
      return true
    })
  }, [items, settings.hiddenCourseIds, settings.dismissedWorkIds, settings.hideDoneInFeed])

  const ranked = useMemo(() => rankItems(visibleItems, progress), [visibleItems, progress])
  const nextThing = useMemo(() => pickNextThing(ranked), [ranked])

  const handleStatusChange = useCallback(
    (item: TodoItem, status: WorkStatus) => {
      const previous = progress[item.id]
      // Optimistic update — the UI reflects the change immediately; a failed
      // write rolls back rather than leaving a stale badge.
      setProgress((p) => ({
        ...p,
        [item.id]: {
          workId: item.id,
          courseId: item.courseId,
          status,
          completedSteps: previous?.completedSteps ?? [],
          secondsSpent: previous?.secondsSpent ?? 0,
          notes: previous?.notes ?? '',
          startedAt: previous?.startedAt ?? (status === 'not-started' ? null : new Date().toISOString()),
          updatedAt: new Date().toISOString(),
        },
      }))
      api.saveProgress(item.id, { courseId: item.courseId, status }).catch(() => {
        setProgress((p) => (previous ? { ...p, [item.id]: previous } : Object.fromEntries(Object.entries(p).filter(([id]) => id !== item.id))))
      })
    },
    [progress],
  )

  const handleDismiss = useCallback(
    (item: TodoItem) => {
      toggleDismissed(item.id)
      setLastDismissed(item)
    },
    [toggleDismissed],
  )

  const handleUndoDismiss = useCallback(() => {
    if (!lastDismissed) return
    toggleDismissed(lastDismissed.id)
    setLastDismissed(null)
  }, [lastDismissed, toggleDismissed])

  const firstName = me?.user?.name?.split(' ')[0]

  return (
    <div>
      <div className="today-header">
        <div>
          <h1>Today</h1>
          <p className="today-header__greeting">
            {firstName ? `Hey ${firstName}. ` : ''}Here's what's on your plate across every class.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setPrefsOpen(true)}>
          Customize feed
        </Button>
      </div>

      <DailySummaryCard />

      {error && <StateBlock kind="error" title="Couldn't load your to-do list" detail={error} />}
      {!error && !items && <StateBlock kind="loading" title="Gathering your assignments…" />}

      {!error && items && (
        <>
          <NextThingCard ranked={nextThing} />
          <TodoList
            ranked={ranked}
            collapsedGroups={prefs.collapsedGroups}
            onToggleCollapse={toggleGroupCollapsed}
            expandedGroups={prefs.expandedGroups}
            onToggleExpand={toggleGroupExpanded}
            onStatusChange={handleStatusChange}
            onDismiss={handleDismiss}
          />
        </>
      )}

      {lastDismissed && (
        <UndoToast
          message={`Hid "${lastDismissed.title}" from Today`}
          onUndo={handleUndoDismiss}
          onDismiss={() => setLastDismissed(null)}
        />
      )}

      <FeedPreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} courses={courses} />
    </div>
  )
}
