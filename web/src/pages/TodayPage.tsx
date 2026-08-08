import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import type { Course, TodoItem } from '../lib/types'
import { DailySummaryCard } from '../components/today/DailySummaryCard'
import { TodoList } from '../components/today/TodoList'
import { FeedPreferencesPanel } from '../components/today/FeedPreferencesPanel'
import { StateBlock } from '../components/ui/StateBlock'
import { Button } from '../components/ui/Button'

export function TodayPage() {
  const { me } = useAuth()
  const { settings } = useSettings()
  const [courses, setCourses] = useState<Course[]>([])
  const [items, setItems] = useState<TodoItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prefsOpen, setPrefsOpen] = useState(false)

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
      {!error && items && <TodoList items={visibleItems} />}

      <FeedPreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} courses={courses} />
    </div>
  )
}
