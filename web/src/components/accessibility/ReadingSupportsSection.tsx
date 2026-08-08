import { useSettings, type ReadingRuler } from '../../lib/settings'
import { ChoiceButton, ToggleRow } from './controls'

const RULER_LABELS: Record<ReadingRuler, string> = {
  off: 'Off',
  ruler: 'Ruler',
  spotlight: 'Spotlight',
}

/** Composable, independently-toggleable reading supports — the real differentiator. */
export function ReadingSupportsSection() {
  const { settings, update } = useSettings()

  return (
    <>
      <ToggleRow
        label="Bionic-style reading"
        hint="Bolds the first part of each word as an anchor for the eye. Purely visual — screen readers still read the whole word."
        checked={settings.bionicReading}
        onChange={(v) => update('bionicReading', v)}
      />

      <fieldset className="a11y-group">
        <legend>Reading ruler</legend>
        <div className="a11y-choice-row">
          {(['off', 'ruler', 'spotlight'] as ReadingRuler[]).map((mode) => (
            <ChoiceButton
              key={mode}
              active={settings.readingRuler === mode}
              onClick={() => update('readingRuler', mode)}
              label={RULER_LABELS[mode]}
            />
          ))}
        </div>
        <p className="a11y-hint">A band that follows your pointer or keyboard focus, dimming the rest of the page.</p>
      </fieldset>

      <ToggleRow
        label="Paragraph focus"
        hint="Dims every paragraph except the one you're hovering or reading."
        checked={settings.paragraphFocus}
        onChange={(v) => update('paragraphFocus', v)}
      />
      <ToggleRow
        label="Extra word spacing"
        hint="More room between words, on top of whatever the typeface already sets."
        checked={settings.extraWordSpacing}
        onChange={(v) => update('extraWordSpacing', v)}
      />
    </>
  )
}
