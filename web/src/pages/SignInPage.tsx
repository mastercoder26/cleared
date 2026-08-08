import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Button } from '../components/ui/Button'
import './sign-in.css'

export function SignInPage() {
  const { me, startGoogleSignIn, startDemo } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const authError = params.get('auth_error')
  const [busy, setBusy] = useState<'google' | 'demo' | null>(null)

  const handleGoogle = async () => {
    setBusy('google')
    try {
      await startGoogleSignIn()
    } finally {
      setBusy(null)
    }
  }

  const handleDemo = async () => {
    setBusy('demo')
    try {
      await startDemo()
      navigate('/courses')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="signin">
      <div className="signin__lead">
        <p className="signin__eyebrow">For students who read Classroom every day</p>
        <h1 className="signin__title">
          See what to actually do. <span>In plain words.</span>
        </h1>
        <p className="signin__sub">
          cleared reads your Classroom assignments and gives you two things a teacher's post never
          does: a one-line version of what to do, and a short list of steps to get started.
        </p>
      </div>

      {authError && (
        <div className="signin__banner" role="alert">
          {decodeURIComponent(authError)}
        </div>
      )}

      <div className="signin__actions">
        <Button onClick={() => void handleGoogle()} disabled={!me?.googleConfigured || busy !== null}>
          {busy === 'google' ? <span className="spinner" aria-hidden="true" /> : <GoogleMark />}
          Sign in with Google Classroom
        </Button>

        <Button variant="secondary" onClick={() => void handleDemo()} disabled={busy !== null}>
          {busy === 'demo' ? <span className="spinner" aria-hidden="true" /> : null}
          Try the demo — no sign-in
        </Button>

        {!me?.googleConfigured && (
          <p className="signin__note">
            Google sign-in isn't set up on this server yet, so it's disabled above. The demo uses
            realistic sample assignments and every feature works the same way.
          </p>
        )}
      </div>

      <div className="signin__how">
        <h2>How it works</h2>
        <ol>
          <li>
            <strong>Open a class.</strong> cleared shows what's assigned, soonest due date first.
          </li>
          <li>
            <strong>Open an assignment.</strong> You get the plain-language version and the
            original teacher text side by side — nothing is hidden from you.
          </li>
          <li>
            <strong>Follow the steps.</strong> Every assignment becomes 3–6 concrete actions with a
            time estimate, so starting isn't the hardest part anymore.
          </li>
        </ol>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  )
}
