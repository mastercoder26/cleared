import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import './dialog.css'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

/**
 * Reusable modal primitive: focus trap, Escape-to-close, focus restored to
 * the trigger on close, `aria-modal`, scroll lock, and the rest of the app
 * marked `inert`/`aria-hidden` while open. AccessibilityPanel, CommandPalette,
 * ShortcutsSheet, and OnboardingFlow all build on this — adopt it for any
 * other overlay instead of hand-rolling focus management again.
 *
 * Props: open, onClose, title, children, className?
 */
export function Dialog({ open, onClose, title, children, className = '' }: DialogProps) {
  const titleId = useId()
  const containerRef = useFocusTrap<HTMLDivElement>({ active: open, onEscape: onClose })

  useEffect(() => {
    if (!open) return
    const root = document.getElementById('root')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    root?.setAttribute('aria-hidden', 'true')
    root?.setAttribute('inert', '')
    return () => {
      document.body.style.overflow = previousOverflow
      root?.removeAttribute('aria-hidden')
      root?.removeAttribute('inert')
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="dialog-overlay" onMouseDown={onClose}>
      <div
        ref={containerRef}
        className={`dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
