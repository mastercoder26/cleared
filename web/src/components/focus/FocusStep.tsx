import type { RewriteStep } from '../../lib/types'
import { ReadAloudButton } from '../ui/ReadAloudButton'
import { Button } from '../ui/Button'
import { FocusTimer } from './FocusTimer'

interface Props {
  step: RewriteStep
  stepNumber: number
  totalSteps: number
  isReview: boolean
  isDone: boolean
  elapsedSeconds: number
  running: boolean
  onToggleTimer: () => void
  onAdvance: () => void
}

/** One step, full attention. Everything else about the assignment is deliberately out of view. */
export function FocusStep({
  step,
  stepNumber,
  totalSteps,
  isReview,
  isDone,
  elapsedSeconds,
  running,
  onToggleTimer,
  onAdvance,
}: Props) {
  return (
    <section className="focus-step" aria-label={`Step ${stepNumber} of ${totalSteps}`}>
      {isReview && <p className="focus-step__review-flag">Looking back — you already finished this one.</p>}

      <p className="focus-step__count">
        Step {stepNumber} of {totalSteps}
      </p>
      <h1 className="focus-step__action">{step.action}</h1>
      {step.detail && <p className="focus-step__detail">{step.detail}</p>}

      <div className="focus-step__tools">
        <ReadAloudButton text={`${step.action}. ${step.detail ?? ''}`} />
      </div>

      {!isReview && (
        <FocusTimer elapsedSeconds={elapsedSeconds} estimatedMinutes={step.minutes} running={running} onToggle={onToggleTimer} />
      )}

      <div className="focus-step__actions">
        {isReview ? (
          <Button variant="primary" onClick={onAdvance}>
            Back to where I was
          </Button>
        ) : (
          <Button variant="primary" onClick={onAdvance} disabled={isDone} className="focus-step__done-btn">
            {isDone ? 'Already done' : "Done with this step"}
          </Button>
        )}
      </div>
    </section>
  )
}
