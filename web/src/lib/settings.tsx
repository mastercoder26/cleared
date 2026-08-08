import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SummaryTone } from './types'

export type Theme = 'light' | 'dark'
export type TextSize = 'standard' | 'large' | 'xlarge'
export type Typeface = 'standard' | 'dyslexia-friendly' | 'reading-proficiency'
export type AccentColor = 'teal' | 'indigo' | 'plum' | 'forest' | 'slate'
export type OverlayTint = 'none' | 'blue' | 'green' | 'yellow' | 'rose'
export type ContentWidth = 'standard' | 'narrow'
export type TodoSort = 'due' | 'class'
export type ReadingRuler = 'off' | 'ruler' | 'spotlight'
export type ProfileId = 'dyslexia' | 'adhd' | 'low-vision' | 'sensory-calm' | 'screen-reader'

export interface Settings {
  // Display & accessibility
  theme: Theme
  textSize: TextSize
  typeface: Typeface
  accentColor: AccentColor
  highContrast: boolean
  reduceMotion: boolean
  extraLineSpacing: boolean
  underlineLinks: boolean
  largerTargets: boolean
  focusMode: boolean
  overlayTint: OverlayTint
  readAloudEnabled: boolean
  contentWidth: ContentWidth

  // Reading supports
  bionicReading: boolean
  readingRuler: ReadingRuler
  paragraphFocus: boolean
  extraWordSpacing: boolean

  // Speech controller
  speechRate: number
  speechPitch: number
  speechVoiceURI: string | null

  // Screen-reader-focused extras
  verboseAnnouncements: boolean
  skipLinkEmphasis: boolean

  // Onboarding + profiles
  hasSeenOnboarding: boolean
  lastAppliedProfileId: ProfileId | null

  // Today feed preferences
  hiddenCourseIds: string[]
  todoSort: TodoSort
  hideDoneInFeed: boolean
  summaryTone: SummaryTone

  // Personal, non-Classroom "I've dealt with this" list — never written back
  // to Google, purely a local memory aid.
  dismissedWorkIds: string[]
}

const DEFAULTS: Settings = {
  theme: 'light',
  textSize: 'standard',
  typeface: 'standard',
  accentColor: 'teal',
  highContrast: false,
  reduceMotion: false,
  extraLineSpacing: false,
  underlineLinks: false,
  largerTargets: false,
  focusMode: false,
  overlayTint: 'none',
  readAloudEnabled: true,
  contentWidth: 'standard',

  bionicReading: false,
  readingRuler: 'off',
  paragraphFocus: false,
  extraWordSpacing: false,

  speechRate: 1,
  speechPitch: 1,
  speechVoiceURI: null,

  verboseAnnouncements: false,
  skipLinkEmphasis: false,

  hasSeenOnboarding: false,
  lastAppliedProfileId: null,

  hiddenCourseIds: [],
  todoSort: 'due',
  hideDoneInFeed: true,
  summaryTone: 'plain',

  dismissedWorkIds: [],
}

const STORAGE_KEY = 'cleared.settings.v3'
// Read from these if v3 has never been written, so upgrading never resets a
// person's saved accessibility choices — those defaults are the whole point.
const LEGACY_STORAGE_KEYS = ['cleared.settings.v2']

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyRaw = localStorage.getItem(legacyKey)
      if (legacyRaw) return { ...DEFAULTS, ...JSON.parse(legacyRaw) }
    }
    return DEFAULTS
  } catch {
    return DEFAULTS
  }
}

interface SettingsContextValue {
  settings: Settings
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  /** Applies several settings at once — used by profiles and onboarding — and
      records which profile (if any) was last applied, so the panel can show
      "Custom" once the person's tweaks diverge from it. */
  applyMany: (patch: Partial<Settings>, profileId: ProfileId | null) => void
  toggleHiddenCourse: (courseId: string) => void
  toggleDismissed: (workId: string) => void
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
    root.dataset.accent = settings.accentColor
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal'
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full'
    root.dataset.lineSpacing = settings.extraLineSpacing ? 'relaxed' : 'normal'
    root.dataset.underlineLinks = String(settings.underlineLinks)
    root.dataset.targets = settings.largerTargets ? 'large' : 'standard'
    root.dataset.focus = settings.focusMode ? 'on' : 'off'
    root.dataset.contentWidth = settings.contentWidth
    root.dataset.overlayTint = settings.overlayTint
    root.dataset.readingRuler = settings.readingRuler
    root.dataset.paragraphFocus = settings.paragraphFocus ? 'on' : 'off'
    root.dataset.wordSpacing = settings.extraWordSpacing ? 'boost' : 'normal'
    root.dataset.skipLinkEmphasis = String(settings.skipLinkEmphasis)
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
      applyMany: (patch, profileId) =>
        setSettings((s) => ({ ...s, ...patch, lastAppliedProfileId: profileId })),
      toggleHiddenCourse: (courseId) =>
        setSettings((s) => ({
          ...s,
          hiddenCourseIds: s.hiddenCourseIds.includes(courseId)
            ? s.hiddenCourseIds.filter((id) => id !== courseId)
            : [...s.hiddenCourseIds, courseId],
        })),
      toggleDismissed: (workId) =>
        setSettings((s) => ({
          ...s,
          dismissedWorkIds: s.dismissedWorkIds.includes(workId)
            ? s.dismissedWorkIds.filter((id) => id !== workId)
            : [...s.dismissedWorkIds, workId],
        })),
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
