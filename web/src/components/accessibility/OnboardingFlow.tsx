import { useState } from 'react'
import { useSettings } from '../../lib/settings'
import { Dialog } from '../ui/Dialog'
import { PROFILES } from './profiles'
import './onboarding.css'

interface Props {
  open: boolean
  onDone: () => void
}

const STEP_COUNT = 3

/**
 * Short, skippable first-run flow: welcome, "which of these sounds like
 * you", confirm. Applying a profile here is just calling the same
 * `applyMany` the panel uses, so it's never a one-way door. Re-openable
 * later from the accessibility panel via the `onOpenOnboarding` prop there.
 */
export function OnboardingFlow({ open, onDone }: Props) {
  const { settings, applyMany, update } = useSettings()
  const [step, setStep] = useState(0)

  const finish = () => {
    update('hasSeenOnboarding', true)
    onDone()
  }

  const chosenProfile = PROFILES.find((p) => p.id === settings.lastAppliedProfileId) ?? null

  return (
    <Dialog open={open} onClose={finish} title="Welcome to cleared" className="onboarding-dialog">
      <div className="onboarding">
        <p className="onboarding__step">
          Step {step + 1} of {STEP_COUNT}
        </p>

        {step === 0 && (
          <div className="onboarding__screen">
            <p className="onboarding__lead">
              cleared works the same for everyone underneath — how you read it is up to you. This
              takes about 30 seconds, and nothing here is permanent.
            </p>
            <div className="onboarding__actions">
              <button type="button" className="btn btn--ghost" onClick={finish}>
                Skip for now
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setStep(1)}>
                Let's go
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding__screen">
            <p className="onboarding__lead">Which of these sounds most like you?</p>
            <div className="onboarding__profiles">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="onboarding__profile"
                  data-selected={settings.lastAppliedProfileId === p.id}
                  onClick={() => applyMany(p.apply, p.id)}
                >
                  <span className="onboarding__profile-label">{p.label}</span>
                  <span className="onboarding__profile-tagline">{p.tagline}</span>
                </button>
              ))}
            </div>
            <div className="onboarding__actions">
              <button type="button" className="btn btn--ghost" onClick={finish}>
                Skip for now
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setStep(0)}>
                Back
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding__screen">
            <p className="onboarding__lead">
              {chosenProfile
                ? `${chosenProfile.label} settings are on now. Fine-tune anything from the accessibility panel any time.`
                : 'No starting point applied — pick individual settings from the accessibility panel any time.'}
            </p>
            <div className="onboarding__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn btn--primary" onClick={finish}>
                Start using cleared
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
