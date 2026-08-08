import {
  useSettings,
  type AccentColor,
  type ContentWidth,
  type OverlayTint,
  type TextSize,
  type Typeface,
} from '../../lib/settings'
import { Dialog } from '../ui/Dialog'
import { ChoiceButton, ToggleRow } from './controls'
import { ProfileSelector } from './ProfileSelector'
import { ReadingSupportsSection } from './ReadingSupportsSection'
import { SpeechSection } from './SpeechSection'
import './accessibility-panel.css'

interface Props {
  open: boolean
  onClose: () => void
  /** Optional — lets the panel offer "Replay welcome tour" without owning onboarding state itself. */
  onReplayOnboarding?: () => void
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
 * choice persists across visits. Built on the shared `Dialog` primitive for
 * focus trap / Escape / scroll lock / inert background.
 */
export function AccessibilityPanel({ open, onClose, onReplayOnboarding }: Props) {
  const { settings, update, reset } = useSettings()

  return (
    <Dialog open={open} onClose={onClose} title="Display & accessibility" className="a11y-dialog">
      <p className="a11y-intro">
        Every control below is independent — turn on any combination that works for you.
      </p>

      <h3 className="a11y-section">Profiles</h3>
      <ProfileSelector />

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

      <h3 className="a11y-section">Reading supports</h3>
      <ReadingSupportsSection />

      <h3 className="a11y-section">Speech</h3>
      <SpeechSection />

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

      <h3 className="a11y-section">Screen reader</h3>
      <ToggleRow
        label="Verbose announcements"
        hint="Status updates (like step counts or a finished rewrite) are announced with more detail."
        checked={settings.verboseAnnouncements}
        onChange={(v) => update('verboseAnnouncements', v)}
      />
      <ToggleRow
        label="Emphasize skip link"
        hint="Makes the first-Tab 'skip to content' link bigger and higher-contrast."
        checked={settings.skipLinkEmphasis}
        onChange={(v) => update('skipLinkEmphasis', v)}
      />

      {onReplayOnboarding && (
        <button type="button" className="a11y-reset" onClick={onReplayOnboarding}>
          Replay welcome tour
        </button>
      )}
      <button type="button" className="a11y-reset" onClick={reset}>
        Reset everything to defaults
      </button>
    </Dialog>
  )
}
