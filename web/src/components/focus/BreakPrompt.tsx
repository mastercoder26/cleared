import { useState } from 'react'
import { Button } from '../ui/Button'

interface Props {
  onContinue: () => void
  onDeclineSession: () => void
}

/** Offered, never forced — and easy to turn off for good this session. */
export function BreakPrompt({ onContinue, onDeclineSession }: Props) {
  const [breaking, setBreaking] = useState(false)

  if (breaking) {
    return (
      <div className="break-prompt" role="status">
        <p className="break-prompt__title">Take a beat.</p>
        <p className="break-prompt__body">
          Stretch, get some water, look away from the screen for a minute. Come back whenever you're ready.
        </p>
        <Button variant="primary" onClick={onContinue}>
          I'm ready, continue
        </Button>
      </div>
    )
  }

  return (
    <div className="break-prompt" role="status">
      <p className="break-prompt__title">Nice, one step down.</p>
      <p className="break-prompt__body">Want a short break before the next one, or keep the momentum going?</p>
      <div className="break-prompt__actions">
        <Button variant="secondary" onClick={() => setBreaking(true)}>
          Take a short break
        </Button>
        <Button variant="primary" onClick={onContinue}>
          Keep going
        </Button>
      </div>
      <button type="button" className="break-prompt__decline" onClick={onDeclineSession}>
        Don't ask again this session
      </button>
    </div>
  )
}
