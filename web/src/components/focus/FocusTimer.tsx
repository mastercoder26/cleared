import { Button } from '../ui/Button'

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface Props {
  elapsedSeconds: number
  estimatedMinutes: number
  running: boolean
  onToggle: () => void
}

/** Time estimates are orientation, not a deadline — going over never reads as a scolding. */
export function FocusTimer({ elapsedSeconds, estimatedMinutes, running, onToggle }: Props) {
  const overEstimate = elapsedSeconds > estimatedMinutes * 60

  return (
    <div className="focus-timer" data-running={running}>
      <p className="focus-timer__clock" aria-live="off">
        {formatClock(elapsedSeconds)}
      </p>
      <p className="focus-timer__estimate">
        {overEstimate
          ? `The guess was about ${estimatedMinutes} min — no rush, keep going as long as you need.`
          : `About ${estimatedMinutes} min estimated for this one.`}
      </p>
      <Button variant="secondary" onClick={onToggle} aria-pressed={running} className="focus-timer__toggle">
        {running ? 'Pause' : 'Start'}
      </Button>
    </div>
  )
}
