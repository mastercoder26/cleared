import { useSpeech } from '../../hooks/useSpeech'
import './speech-text.css'

interface Props {
  text: string
  label?: string
}

/**
 * Read-aloud text with word-level highlighting synced to
 * SpeechSynthesisUtterance `boundary` events, via `useSpeech`. A heavier
 * drop-in than `ReadAloudButton` for the places worth the extra chrome —
 * shows the currently-spoken word and gives play/pause/resume/stop.
 */
export function SpeechText({ text, label = 'Read aloud' }: Props) {
  const { state, wordRange, play, pause, resume, stop, supported } = useSpeech(text)

  if (!supported) return <p className="speech-text__plain">{text}</p>

  const before = wordRange ? text.slice(0, wordRange.start) : text
  const current = wordRange ? text.slice(wordRange.start, wordRange.end) : ''
  const after = wordRange ? text.slice(wordRange.end) : ''

  const handlePrimary = () => {
    if (state === 'idle') play()
    else if (state === 'speaking') pause()
    else resume()
  }

  return (
    <div className="speech-text">
      <p className="speech-text__body">
        {before}
        <mark className="speech-text__current">{current}</mark>
        {after}
      </p>
      <div className="speech-text__controls">
        <button type="button" className="btn btn--secondary" onClick={handlePrimary}>
          {state === 'speaking' ? 'Pause' : state === 'paused' ? 'Resume' : label}
        </button>
        {state !== 'idle' && (
          <button type="button" className="btn btn--ghost" onClick={stop}>
            Stop
          </button>
        )}
      </div>
    </div>
  )
}
