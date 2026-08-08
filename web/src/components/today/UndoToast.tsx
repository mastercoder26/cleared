import './today.css'

interface Props {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

/** A brief, dismissible confirmation with an undo path — used after "Hide from Today". */
export function UndoToast({ message, onUndo, onDismiss }: Props) {
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <div className="undo-toast__actions">
        <button type="button" className="undo-toast__btn" onClick={onUndo}>
          Undo
        </button>
        <button type="button" className="undo-toast__close" onClick={onDismiss} aria-label="Dismiss notification">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
