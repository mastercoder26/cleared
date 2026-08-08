import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'
export type TextSize = 'standard' | 'large' | 'xlarge'
export type Typeface = 'standard' | 'dyslexia-friendly'

export interface Settings {
  theme: Theme
  textSize: TextSize
  typeface: Typeface
  highContrast: boolean
  reduceMotion: boolean
  extraLineSpacing: boolean
}

const DEFAULTS: Settings = {
  theme: 'light',
  textSize: 'standard',
  typeface: 'standard',
  highContrast: false,
  reduceMotion: false,
  extraLineSpacing: false,
}

const STORAGE_KEY = 'cleared.settings.v1'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

interface SettingsContextValue {
  settings: Settings
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.textSize = settings.textSize
    root.dataset.typeface = settings.typeface
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal'
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full'
    root.dataset.lineSpacing = settings.extraLineSpacing ? 'relaxed' : 'normal'
  }, [settings])

  // Respect the OS-level reduced-motion preference on first load, without
  // overriding a choice the person already made in the panel.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) setSettings((s) => ({ ...s, reduceMotion: true }))
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (key, val) => setSettings((s) => ({ ...s, [key]: val })),
      reset: () => setSettings(DEFAULTS),
    }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
