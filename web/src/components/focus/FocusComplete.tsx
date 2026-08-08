import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

interface Props {
  courseId: string
  workId: string
  totalSeconds: number
  classroomLink: string | null
  onMarkDone: () => void
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 1) return 'under a minute'
  if (minutes === 1) return '1 minute'
  return `${minutes} minutes`
}

/** The finish line — calm, not confetti-loud, with a clear next move. */
export function FocusComplete({ courseId, workId, totalSeconds, classroomLink, onMarkDone }: Props) {
  return (
    <section className="focus-complete" aria-label="All steps complete">
      <h1 className="focus-complete__title">All steps done.</h1>
      <p className="focus-complete__body">You spent about {formatDuration(totalSeconds)} of focused time on this.</p>

      <div className="focus-complete__actions">
        <Button variant="primary" onClick={onMarkDone}>
          Mark assignment done
        </Button>
        <Link to={`/courses/${courseId}/coursework/${workId}`} className="btn btn--secondary">
          Back to assignment
        </Link>
        {classroomLink && (
          <a href={classroomLink} target="_blank" rel="noreferrer" className="btn btn--ghost">
            Open in Classroom to turn it in
          </a>
        )}
      </div>
    </section>
  )
}
