import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import type { Me } from './types'

interface AuthContextValue {
  me: Me | null
  loading: boolean
  signedIn: boolean
  refresh: () => Promise<void>
  startGoogleSignIn: () => Promise<void>
  startDemo: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

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

  const startGoogleSignIn = useCallback(async () => {
    const { url } = await api.startGoogleSignIn()
    window.location.href = url
  }, [])

  const startDemo = useCallback(async () => {
    await api.startDemo()
    await refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await api.signOut()
    await refresh()
  }, [refresh])

  return (
    <AuthContext.Provider
      value={{
        me,
        loading,
        signedIn: Boolean(me?.user),
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
