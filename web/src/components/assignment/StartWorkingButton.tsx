import { Link } from 'react-router-dom'

/** The unmissable entry into focus mode — deliberately the loudest thing on the page. */
export function StartWorkingButton({
  courseId,
  workId,
  ready,
}: {
  courseId: string
  workId: string
  ready: boolean
}) {
  if (!ready) {
    return (
      <button type="button" className="start-working-btn" disabled>
        Preparing your steps…
      </button>
    )
  }

  return (
    <Link to={`/focus/${courseId}/${workId}`} className="start-working-btn">
      <span className="start-working-btn__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M7 5v14l12-7L7 5Z" fill="currentColor" />
        </svg>
      </span>
      Start working
    </Link>
  )
}
