import { useEffect, useState } from 'react'
import { useFeedPrefs } from '../lib/feedPrefs'
import type { WorkloadDay } from '../lib/types'
import { WeekCalendar } from '../components/plan/WeekCalendar'
import { RangeToggle } from '../components/plan/RangeToggle'
import { CrunchCallout } from '../components/plan/CrunchCallout'
import { loadWorkload, findCrunch } from '../components/plan/planMath'
import { StateBlock } from '../components/ui/StateBlock'
import '../components/plan/plan.css'

/** The week view — the antidote to time blindness. Shows load shape, not a flat due-date list. */
export function PlanPage() {
  const { prefs, setPlanRangeDays } = useFeedPrefs()
  const [days, setDays] = useState<WorkloadDay[] | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadWorkload(prefs.planRangeDays)
      .then((res) => {
        if (cancelled) return
        setDays(res.days)
        setIsFallback(res.isFallback)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your week — not even a rough estimate.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [prefs.planRangeDays])

  const crunch = days ? findCrunch(days) : null

  return (
    <div>
      <div className="plan-header">
        <div>
          <h1>Plan</h1>
          <p className="plan-header__intro">See the shape of your week — where it's clear, and where it's not.</p>
        </div>
        <RangeToggle value={prefs.planRangeDays} onChange={setPlanRangeDays} />
      </div>

      {error && <StateBlock kind="error" title="Couldn't load your week" detail={error} />}
      {!error && loading && <StateBlock kind="loading" title="Mapping out your week…" />}

      {!error && !loading && days && days.length === 0 && (
        <StateBlock kind="empty" title="Nothing to plan around yet" detail="Once you have assignments due, they'll show up here." />
      )}

      {!error && !loading && days && days.length > 0 && (
        <>
          <CrunchCallout insight={crunch} />
          {isFallback && (
            <p className="plan-fallback-note">
              Estimating from your to-do list — the full workload calculation isn't available right now, so these
              numbers are a rough guess.
            </p>
          )}
          <WeekCalendar days={days} />
        </>
      )}
    </div>
  )
}
