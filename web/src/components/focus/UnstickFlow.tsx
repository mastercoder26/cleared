import { useState } from 'react'
import { api } from '../../lib/api'
import type { RewriteStep, StuckFeeling, UnstickHelp } from '../../lib/types'
import { Button } from '../ui/Button'
import { StateBlock } from '../ui/StateBlock'

const FEELINGS: { value: StuckFeeling; label: string }[] = [
  { value: 'dont-understand', label: "I don't understand what to do" },
  { value: 'too-big', label: 'It feels like too much at once' },
  { value: 'cant-start', label: "I can't make myself start" },
  { value: 'lost-interest', label: "I've lost interest in this" },
]

// Used when the server can't be reached — genuinely useful, just not personalized to the
// specific step. Someone hits this button at their worst moment; it must never dead-end.
const FALLBACK_HELP: UnstickHelp = {
  reframe: 'Read just the next sentence of the step again, slowly — out loud if you can.',
  nudges: [
    'Open the document or tab you need, even if you do nothing else yet.',
    'Set a timer for 5 minutes and work only until it rings.',
    'Write one sentence. It does not have to be good.',
  ],
  smallestNextAction: 'Open the document and type one word.',
  encouragement: 'Getting stuck happens. Opening this panel already counts as a step.',
}

type Stage = 'ask' | 'loading' | 'result' | 'fallback'

interface Props {
  courseId: string
  workId: string
  step: RewriteStep | null
  stepIndex: number | null
  onClose: () => void
}

/** Reachable from the assignment page and focus mode alike — this is the moment it's needed. */
export function UnstickFlow({ courseId, workId, step, stepIndex, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('ask')
  const [tried, setTried] = useState('')
  const [help, setHelp] = useState<UnstickHelp | null>(null)

  const submit = async (feeling: StuckFeeling) => {
    setStage('loading')
    try {
      const { help: result } = await api.unstick({ courseId, workId, stepIndex, tried, feeling })
      setHelp(result)
      setStage('result')
    } catch {
      setHelp(FALLBACK_HELP)
      setStage('fallback')
    }
  }

  return (
    <div className="unstick-overlay">
      <div className="unstick-panel" role="dialog" aria-modal="true" aria-labelledby="unstick-title">
        <div className="unstick-panel__header">
          <h2 id="unstick-title">I'm stuck</h2>
          <button type="button" className="unstick-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {step && <p className="unstick-panel__step">On: {step.action}</p>}

        {stage === 'ask' && (
          <>
            <label className="unstick-panel__label" htmlFor="unstick-tried">
              What have you tried so far? (optional)
            </label>
            <textarea
              id="unstick-tried"
              className="unstick-panel__textarea"
              value={tried}
              onChange={(e) => setTried(e.target.value)}
              rows={3}
            />
            <p className="unstick-panel__prompt">What's it feel like right now?</p>
            <div className="unstick-panel__feelings">
              {FEELINGS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className="unstick-feeling-btn"
                  onClick={() => void submit(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

        {stage === 'loading' && (
          <StateBlock kind="loading" title="Finding a way back in…" detail="Give it a few seconds." />
        )}

        {(stage === 'result' || stage === 'fallback') && help && (
          <div className="unstick-result">
            {stage === 'fallback' && (
              <p className="unstick-result__notice">
                Couldn't reach the personalized helper right now — here's a general way back in.
              </p>
            )}
            <div className="unstick-result__action">
              <p className="unstick-result__action-label">Try this right now</p>
              <p className="unstick-result__action-text">{help.smallestNextAction}</p>
            </div>
            <p className="unstick-result__reframe">{help.reframe}</p>
            <ul className="unstick-result__nudges">
              {help.nudges.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <p className="unstick-result__encouragement">{help.encouragement}</p>
            <div className="unstick-result__actions">
              <Button variant="secondary" onClick={() => setStage('ask')}>
                Still stuck — ask again
              </Button>
              <Button variant="primary" onClick={onClose}>
                Okay, back to it
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
