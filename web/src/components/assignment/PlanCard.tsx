import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { WorkPlan } from '../../lib/types'
import { StateBlock } from '../ui/StateBlock'

type Status = 'loading' | 'ready' | 'unavailable'

/**
 * "When should I start this?" — the antidote to time blindness. For anything
 * due more than a day out, the start date matters more than the due date.
 * Degrades quietly (never a red error wall) if planning isn't configured or
 * the endpoint isn't reachable yet.
 */
export function PlanCard({ courseId, workId }: { courseId: string; workId: string }) {
  const [status, setStatus] = useState<Status>('loading')
  const [plan, setPlan] = useState<WorkPlan | null>(null)
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    api
      .plan(courseId, workId)
      .then(({ plan: result }) => {
        if (cancelled) return
        setPlan(result)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setUnavailableReason(
          err instanceof ApiError && err.status === 503
            ? 'Planning needs an API key set up on the server.'
            : 'Planning isn’t available right now.',
        )
        setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [courseId, workId])

  if (status === 'loading') {
    return <StateBlock kind="loading" title="Working out when to start…" />
  }

  if (status === 'unavailable' || !plan) {
    return (
      <div className="plan-card plan-card--quiet">
        <p className="plan-card__quiet-text">{unavailableReason}</p>
      </div>
    )
  }

  return (
    <section className="plan-card" aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="plan-card__heading">
        When to start
      </h2>
      <p className="plan-card__start-by">{formatStartBy(plan.startBy)}</p>
      <p className="plan-card__rationale">{plan.rationale}</p>

      {plan.sessions.length > 0 && (
        <ol className="plan-card__sessions">
          {plan.sessions.map((session, i) => (
            <li key={i} className="plan-card__session">
              <span className="plan-card__session-label">{session.label}</span>
              <span className="plan-card__session-goal">{session.goal}</span>
              <span className="plan-card__session-minutes">~{session.minutes} min</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function formatStartBy(startBy: string): string {
  const d = new Date(`${startBy}T00:00:00`)
  if (Number.isNaN(d.getTime())) return `Start by ${startBy}`
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday ? `Start today — ${label}` : `Start by ${label}`
}
