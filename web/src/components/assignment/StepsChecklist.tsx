import type { Rewrite } from '../../lib/types'

/** Real checkboxes, persisted progress, and a running "time left" instead of a wall of steps. */
export function StepsChecklist({
  rewrite,
  completedSteps,
  onToggle,
}: {
  rewrite: Rewrite
  completedSteps: number[]
  onToggle: (index: number) => void
}) {
  const completed = new Set(completedSteps)
  const remainingMinutes = rewrite.steps.reduce((sum, s, i) => (completed.has(i) ? sum : sum + s.minutes), 0)

  return (
    <>
      <p className="steps-summary">
        {completed.size} of {rewrite.steps.length} done
        {remainingMinutes > 0 && ` · about ${remainingMinutes} min left`}
      </p>
      <ol className="steps">
        {rewrite.steps.map((step, i) => {
          const done = completed.has(i)
          const fieldId = `step-check-${i}`
          return (
            <li key={i} className="step" data-done={done}>
              <input
                type="checkbox"
                id={fieldId}
                className="step__checkbox"
                checked={done}
                onChange={() => onToggle(i)}
              />
              <label htmlFor={fieldId} className="step__body">
                <span className="step__number" aria-hidden="true">
                  {done ? '✓' : i + 1}
                </span>
                <span>
                  <span className="step__action">{step.action}</span>
                  {step.detail && <span className="step__detail">{step.detail}</span>}
                </span>
              </label>
              <span className="step__minutes">~{step.minutes} min</span>
            </li>
          )
        })}
      </ol>
    </>
  )
}
