import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel'
import './app-shell.css'

/**
 * The persistent frame: skip link, header nav, accessibility panel trigger,
 * and the routed page content in <main>. Every page renders inside this.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { me, signedIn, signOut } = useAuth()
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="shell-header">
        <div className="shell-header__inner">
          <NavLink to="/" className="shell-brand" aria-label="cleared home">
            <span className="shell-brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path
                  d="M5 12.5 9.5 17 19 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            cleared
          </NavLink>

          <nav aria-label="Primary" className="shell-nav">
            {signedIn && (
              <>
                <NavLink to="/today" className="shell-nav__link">
                  Today
                </NavLink>
                <NavLink to="/courses" className="shell-nav__link">
                  Classes
                </NavLink>
              </>
            )}
          </nav>

          <div className="shell-actions">
            <button
              type="button"
              className="shell-icon-btn"
              onClick={() => setPanelOpen(true)}
              aria-haspopup="dialog"
            >
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="shell-icon-btn__label">Display &amp; accessibility</span>
            </button>

            {signedIn && (
              <div className="shell-user">
                {me?.demo && <span className="shell-demo-badge">Demo mode</span>}
                <span className="shell-user__name">{me?.user?.name}</span>
                <button type="button" className="shell-textbtn" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="shell-main">
        {children}
      </main>

      <div className="reading-overlay" aria-hidden="true" />

      <AccessibilityPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}
