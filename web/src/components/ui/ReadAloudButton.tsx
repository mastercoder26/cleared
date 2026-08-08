import { useEffect, useState } from 'react'
import { speechController, speechSupported } from '../../lib/speak'
import { useSettings } from '../../lib/settings'

/** Only rendered where read-aloud is genuinely useful; hidden entirely if disabled or unsupported. */
export function ReadAloudButton({ text, label = 'Read aloud' }: { text: string; label?: string }) {
  const { settings } = useSettings()
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (!speechSupported) return
    // The old code listened for 'end'/'cancel' directly on speechSynthesis,
    // which the Web Speech API never actually fires — only utterances do.
    // speechController tracks real state centrally instead.
    return speechController.onStateChange((state) => setSpeaking(state === 'speaking'))
  }, [])

  useEffect(() => () => speechController.stop(), []) // stop any lingering utterance if the component unmounts

  if (!settings.readAloudEnabled || !speechSupported) return null

  const toggle = () => {
    if (speaking) {
      speechController.stop()
    } else {
      speechController.speak(text, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        voiceURI: settings.speechVoiceURI,
      })
    }
  }

  return (
    <button type="button" className="read-aloud-btn" onClick={toggle} aria-pressed={speaking}>
      <span aria-hidden="true">
        {speaking ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 9v6h4l5 4V5L8 9H4Z"
              fill="currentColor"
            />
            <path
              d="M16.5 8.5a5 5 0 0 1 0 7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      {speaking ? 'Stop reading' : label}
    </button>
  )
}
