import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, SESSION_EXPIRED_EVENT } from './api'
import type { Me } from './types'

interface AuthContextValue {
  me: Me | null
  loading: boolean
  signedIn: boolean
  /** Set when the session ended mid-session, so the sign-in page can explain why. */
  expiredMessage: string | null
  clearExpiredMessage: () => void
  refresh: () => Promise<void>
  startGoogleSignIn: () => Promise<void>
  startDemo: () => Promise<void>
  signOut: () => Promise<void>
}

const EXPIRED_MESSAGE = 'Your session ended, so you were signed out. Sign in again to pick up where you left off.'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setMe(await api.me())
    } catch {
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Any 401 anywhere in the app lands here, so a stale cookie can't leave one
  // screen rendering data the server has already stopped honouring.
  useEffect(() => {
    const onExpired = () => {
      setMe((current) => (current?.user ? { ...current, user: null, demo: false } : current))
      setExpiredMessage(EXPIRED_MESSAGE)
      void refresh()
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [refresh])

  const startGoogleSignIn = useCallback(async () => {
    const { url } = await api.startGoogleSignIn()
    window.location.href = url
  }, [])

  const startDemo = useCallback(async () => {
    await api.startDemo()
    setExpiredMessage(null)
    await refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await api.signOut()
    setExpiredMessage(null)
    await refresh()
  }, [refresh])

  const clearExpiredMessage = useCallback(() => setExpiredMessage(null), [])

  return (
    <AuthContext.Provider
      value={{
        me,
        loading,
        signedIn: Boolean(me?.user),
        expiredMessage,
        clearExpiredMessage,
        refresh,
        startGoogleSignIn,
        startDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
