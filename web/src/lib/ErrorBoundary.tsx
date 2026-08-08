import { Component, type ErrorInfo, type ReactNode } from 'react'
import './error-boundary.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * A render crash used to blank the page. A white screen is the worst possible
 * failure for this app's readers — there is nothing to read, nothing to click,
 * and no way to tell whether it's their fault. This always leaves something
 * on screen and always offers a way out.
 *
 * Class component because React still has no hook equivalent for this.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('cleared crashed while rendering:', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.assign('/')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="crash" role="alert">
        <div className="crash__inner">
          <h1 className="crash__title">Something broke on our side.</h1>
          <p className="crash__body">
            This isn't anything you did. Your classes and assignments are untouched — the page
            just failed to draw.
          </p>
          <button type="button" className="btn btn--primary" onClick={this.handleReload}>
            Start over
          </button>
          <details className="crash__details">
            <summary>Technical details</summary>
            <pre>{error.message}</pre>
          </details>
        </div>
      </div>
    )
  }
}
