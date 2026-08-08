import { useEffect, useState } from 'react'
import { speechController, speechSupported } from '../../lib/speak'
import { useSettings } from '../../lib/settings'
import { ToggleRow } from './controls'

/** Voice, rate, and pitch controls for the shared speech controller, plus the read-aloud-buttons toggle. */
export function SpeechSection() {
  const { settings, update } = useSettings()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(speechController.getVoices())

  useEffect(() => speechController.onVoicesChanged(setVoices), [])

  return (
    <>
      <ToggleRow
        label="Read-aloud buttons"
        hint="Shows a button to have assignment text read out loud."
        checked={settings.readAloudEnabled}
        onChange={(v) => update('readAloudEnabled', v)}
      />

      {!speechSupported && (
        <p className="a11y-hint">This browser doesn't support text-to-speech.</p>
      )}

      {speechSupported && (
        <>
          <fieldset className="a11y-group">
            <legend>Voice</legend>
            <select
              className="a11y-select"
              value={settings.speechVoiceURI ?? ''}
              onChange={(e) => update('speechVoiceURI', e.target.value || null)}
            >
              <option value="">System default</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="a11y-group">
            <legend>Speaking rate — {settings.speechRate.toFixed(2)}×</legend>
            <input
              type="range"
              className="a11y-slider"
              min={0.5}
              max={2}
              step={0.05}
              value={settings.speechRate}
              onChange={(e) => update('speechRate', Number(e.target.value))}
              aria-label="Speaking rate"
            />
          </fieldset>

          <fieldset className="a11y-group">
            <legend>Pitch — {settings.speechPitch.toFixed(2)}</legend>
            <input
              type="range"
              className="a11y-slider"
              min={0}
              max={2}
              step={0.05}
              value={settings.speechPitch}
              onChange={(e) => update('speechPitch', Number(e.target.value))}
              aria-label="Speech pitch"
            />
          </fieldset>
        </>
      )}
    </>
  )
}
