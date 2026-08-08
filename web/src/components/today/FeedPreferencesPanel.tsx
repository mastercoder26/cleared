import { useEffect, useRef } from 'react'
import type { Course } from '../../lib/types'
import { useSettings, type TodoSort } from '../../lib/settings'
import './today.css'

interface Props {
  open: boolean
  onClose: () => void
  courses: Course[]
}

/** Controls what appears in the Today feed — separate from the accessibility panel on purpose. */
export function FeedPreferencesPanel({ open, onClose, courses }: Props) {
  const { settings, update, toggleHiddenCourse } = useSettings()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="a11y-overlay" onClick={onClose}>
      <div
        className="a11y-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="a11y-panel__header">
          <h2 id="feed-panel-title">Customize your feed</h2>
          <button ref={closeBtnRef} type="button" className="a11y-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="a11y-intro">Choose what shows up on your Today page.</p>

        <fieldset className="a11y-group">
          <legend>Classes shown</legend>
          <div className="feed-course-list">
            {courses.map((c) => {
              const hidden = settings.hiddenCourseIds.includes(c.id)
              return (
                <label key={c.id} className="feed-course-row">
                  <input type="checkbox" checked={!hidden} onChange={() => toggleHiddenCourse(c.id)} />
                  {c.name}
                </label>
              )
            })}
            {courses.length === 0 && <p className="a11y-hint">No classes yet.</p>}
          </div>
        </fieldset>

        <fieldset className="a11y-group">
          <legend>Group by</legend>
          <div className="a11y-choice-row">
            {(['due', 'class'] as TodoSort[]).map((sort) => (
              <button
                key={sort}
                type="button"
                className="a11y-choice"
                aria-pressed={settings.todoSort === sort}
                onClick={() => update('todoSort', sort)}
              >
                {sort === 'due' ? 'Due date' : 'Class'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="a11y-toggle-row" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div>
            <p className="a11y-toggle-label">Hide turned-in work</p>
            <p className="a11y-hint">Keeps the list focused on what's still outstanding.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.hideDoneInFeed}
            aria-label="Hide turned-in work"
            className="a11y-switch"
            data-on={settings.hideDoneInFeed}
            onClick={() => update('hideDoneInFeed', !settings.hideDoneInFeed)}
          >
            <span className="a11y-switch__thumb" />
          </button>
        </div>

        {settings.dismissedWorkIds.length > 0 && (
          <button type="button" className="a11y-reset" onClick={() => update('dismissedWorkIds', [])}>
            Show {settings.dismissedWorkIds.length} hidden item{settings.dismissedWorkIds.length === 1 ? '' : 's'} again
          </button>
        )}
      </div>
    </div>
  )
}
