import { useEffect, useRef } from 'react'
import {
  useSettings,
  type AccentColor,
  type ContentWidth,
  type OverlayTint,
  type TextSize,
  type Typeface,
} from '../../lib/settings'
import './accessibility-panel.css'

interface Props {
  open: boolean
  onClose: () => void
}

const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: 'teal', label: 'Teal', swatch: '#205e5a' },
  { id: 'indigo', label: 'Indigo', swatch: '#3c4a9e' },
  { id: 'plum', label: 'Plum', swatch: '#7a3466' },
  { id: 'forest', label: 'Forest', swatch: '#386423' },
  { id: 'slate', label: 'Slate', swatch: '#40525c' },
]

const TINTS: { id: OverlayTint; label: string; swatch: string | null }[] = [
  { id: 'none', label: 'None', swatch: null },
  { id: 'blue', label: 'Blue', swatch: '#bcd6f5' },
  { id: 'green', label: 'Green', swatch: '#c7e8c9' },
  { id: 'yellow', label: 'Yellow', swatch: '#f7e9a8' },
  { id: 'rose', label: 'Rose', swatch: '#f3c9d6' },
]

/**
 * A real settings panel, not a decorative theme switcher: every control here
 * changes a specific, independently-toggleable rendering behavior, and each
 * choice persists across visits.
 */
export function AccessibilityPanel({ open, onClose }: Props) {
  const { settings, update, reset } = useSettings()
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
          Every control below is independent — turn on any combination that works for you.
        </p>

        <h3 className="a11y-section">Color</h3>

        <fieldset className="a11y-group">
          <legend>Theme</legend>
          <div className="a11y-choice-row">
            <ChoiceButton active={settings.theme === 'light'} onClick={() => update('theme', 'light')} label="Light" />
            <ChoiceButton active={settings.theme === 'dark'} onClick={() => update('theme', 'dark')} label="Dark" />
          </div>
        </fieldset>

        <fieldset className="a11y-group">
          <legend>Accent color</legend>
          <div className="a11y-swatch-row">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="a11y-swatch"
                style={{ background: a.swatch }}
                aria-pressed={settings.accentColor === a.id}
                aria-label={a.label}
                title={a.label}
                onClick={() => update('accentColor', a.id)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="a11y-group">
          <legend>Reading overlay tint</legend>
          <div className="a11y-swatch-row">
            {TINTS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="a11y-swatch a11y-swatch--tint"
                style={t.swatch ? { background: t.swatch } : undefined}
                aria-pressed={settings.overlayTint === t.id}
                aria-label={t.label}
                title={t.label}
                onClick={() => update('overlayTint', t.id)}
              >
                {!t.swatch && '×'}
              </button>
            ))}
          </div>
          <p className="a11y-hint">A soft color wash over the whole page — some readers with dyslexia find this reduces visual strain.</p>
        </fieldset>

        <ToggleRow
          label="High contrast"
          hint="Pure black/white text and borders, stronger outlines. Overrides accent color."
          checked={settings.highContrast}
          onChange={(v) => update('highContrast', v)}
        />

        <h3 className="a11y-section">Text</h3>

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
            {(['standard', 'dyslexia-friendly', 'reading-proficiency'] as Typeface[]).map((face) => (
              <ChoiceButton
                key={face}
                active={settings.typeface === face}
                onClick={() => update('typeface', face)}
                label={
                  face === 'standard' ? 'Standard' : face === 'dyslexia-friendly' ? 'Dyslexia-friendly' : 'Reading-focused'
                }
              />
            ))}
          </div>
          <p className="a11y-hint">
            Dyslexia-friendly widens letter and word spacing. Reading-focused uses Lexend, a typeface
            built to improve reading proficiency.
          </p>
        </fieldset>

        <fieldset className="a11y-group">
          <legend>Column width</legend>
          <div className="a11y-choice-row">
            {(['standard', 'narrow'] as ContentWidth[]).map((w) => (
              <ChoiceButton
                key={w}
                active={settings.contentWidth === w}
                onClick={() => update('contentWidth', w)}
                label={w === 'standard' ? 'Standard' : 'Narrow'}
              />
            ))}
          </div>
          <p className="a11y-hint">A narrower column can make lines of text easier to track.</p>
        </fieldset>

        <ToggleRow
          label="Extra line spacing"
          hint="More room between lines and paragraphs."
          checked={settings.extraLineSpacing}
          onChange={(v) => update('extraLineSpacing', v)}
        />
        <ToggleRow
          label="Underline links"
          hint="Makes links visible without relying on color alone."
          checked={settings.underlineLinks}
          onChange={(v) => update('underlineLinks', v)}
        />

        <h3 className="a11y-section">Motion &amp; interaction</h3>

        <ToggleRow
          label="Reduce motion"
          hint="Turns off animations and transitions."
          checked={settings.reduceMotion}
          onChange={(v) => update('reduceMotion', v)}
        />
        <ToggleRow
          label="Larger tap targets"
          hint="Bigger buttons and switches — easier to hit precisely."
          checked={settings.largerTargets}
          onChange={(v) => update('largerTargets', v)}
        />
        <ToggleRow
          label="Focus mode"
          hint="Hides secondary text and navigation so only the essentials show."
          checked={settings.focusMode}
          onChange={(v) => update('focusMode', v)}
        />
        <ToggleRow
          label="Read-aloud buttons"
          hint="Shows a button to have assignment text read out loud."
          checked={settings.readAloudEnabled}
          onChange={(v) => update('readAloudEnabled', v)}
        />

        <button type="button" className="a11y-reset" onClick={reset}>
          Reset everything to defaults
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
