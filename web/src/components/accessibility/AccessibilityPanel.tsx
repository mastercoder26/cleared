import { useEffect, useRef } from 'react'
import { useSettings, type TextSize, type Typeface } from '../../lib/settings'
import './accessibility-panel.css'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * A real settings panel, not a decorative theme switcher: every control here
 * changes a specific, independently-toggleable rendering behavior, and each
 * choice persists across visits.
 */
export function AccessibilityPanel({ open, onClose }: Props) {
  const { settings, update, reset } = useSettings()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
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
        aria-labelledby="a11y-panel-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="a11y-panel__header">
          <h2 id="a11y-panel-title">Display &amp; accessibility</h2>
          <button ref={closeBtnRef} type="button" className="a11y-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="a11y-intro">
          These change how the whole app renders. Pick any combination — nothing here is exclusive.
        </p>

        <fieldset className="a11y-group">
          <legend>Color theme</legend>
          <div className="a11y-choice-row">
            <ChoiceButton
              active={settings.theme === 'light'}
              onClick={() => update('theme', 'light')}
              label="Light"
            />
            <ChoiceButton
              active={settings.theme === 'dark'}
              onClick={() => update('theme', 'dark')}
              label="Dark"
            />
          </div>
        </fieldset>

        <fieldset className="a11y-group">
          <legend>Text size</legend>
          <div className="a11y-choice-row">
            {(['standard', 'large', 'xlarge'] as TextSize[]).map((size) => (
              <ChoiceButton
                key={size}
                active={settings.textSize === size}
                onClick={() => update('textSize', size)}
                label={size === 'standard' ? 'Standard' : size === 'large' ? 'Large' : 'Extra large'}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="a11y-group">
          <legend>Typeface</legend>
          <div className="a11y-choice-row">
            {(['standard', 'dyslexia-friendly'] as Typeface[]).map((face) => (
              <ChoiceButton
                key={face}
                active={settings.typeface === face}
                onClick={() => update('typeface', face)}
                label={face === 'standard' ? 'Standard' : 'Dyslexia-friendly'}
              />
            ))}
          </div>
          <p className="a11y-hint">
            Dyslexia-friendly widens letter and word spacing and switches typeface.
          </p>
        </fieldset>

        <ToggleRow
          label="High contrast"
          hint="Pure black/white text and borders, stronger outlines."
          checked={settings.highContrast}
          onChange={(v) => update('highContrast', v)}
        />
        <ToggleRow
          label="Extra line spacing"
          hint="More room between lines and paragraphs."
          checked={settings.extraLineSpacing}
          onChange={(v) => update('extraLineSpacing', v)}
        />
        <ToggleRow
          label="Reduce motion"
          hint="Turns off animations and transitions."
          checked={settings.reduceMotion}
          onChange={(v) => update('reduceMotion', v)}
        />

        <button type="button" className="a11y-reset" onClick={reset}>
          Reset to defaults
        </button>
      </div>
    </div>
  )
}

function ChoiceButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className="a11y-choice" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="a11y-toggle-row">
      <div>
        <p className="a11y-toggle-label">{label}</p>
        <p className="a11y-hint">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="a11y-switch"
        data-on={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="a11y-switch__thumb" />
      </button>
    </div>
  )
}
