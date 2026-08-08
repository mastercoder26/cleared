import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './lib/settings'
import { AuthProvider } from './lib/auth'
import { ErrorBoundary } from './lib/ErrorBoundary'

// The boundary wraps the providers, not just the routes, so a crash inside
// settings or auth still renders something the reader can act on.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
