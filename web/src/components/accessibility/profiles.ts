import type { ProfileId, Settings } from '../../lib/settings'

export interface ProfileDefinition {
  id: ProfileId
  label: string
  tagline: string
  apply: Partial<Settings>
}

/**
 * One-tap starting points. Each is just a named bundle of the same settings
 * exposed individually elsewhere in the panel — applying one is never a
 * lock, and every value it sets can still be changed afterward.
 */
export const PROFILES: ProfileDefinition[] = [
  {
    id: 'dyslexia',
    label: 'Dyslexia',
    tagline: 'Dyslexia-friendly type, roomy line spacing, larger text, a narrower column, reading ruler on.',
    apply: {
      typeface: 'dyslexia-friendly',
      extraLineSpacing: true,
      textSize: 'large',
      contentWidth: 'narrow',
      readingRuler: 'ruler',
    },
  },
  {
    id: 'adhd',
    label: 'ADHD / focus',
    tagline: 'Focus mode, a narrower column, one paragraph at a time.',
    apply: {
      focusMode: true,
      contentWidth: 'narrow',
      reduceMotion: false,
      paragraphFocus: true,
    },
  },
  {
    id: 'low-vision',
    label: 'Low vision',
    tagline: 'Extra-large text, high contrast, bigger tap targets, underlined links.',
    apply: {
      textSize: 'xlarge',
      highContrast: true,
      largerTargets: true,
      underlineLinks: true,
    },
  },
  {
    id: 'sensory-calm',
    label: 'Sensory-calm',
    tagline: 'Reduced motion, a quiet accent, no overlay tint, low-stimulation surfaces.',
    apply: {
      reduceMotion: true,
      accentColor: 'slate',
      overlayTint: 'none',
    },
  },
  {
    id: 'screen-reader',
    label: 'Screen reader',
    tagline: 'Verbose live announcements, an emphasized skip link, motion off.',
    apply: {
      reduceMotion: true,
      verboseAnnouncements: true,
      skipLinkEmphasis: true,
    },
  },
]

/** The profile whose bundle exactly matches the current settings, or null if
    nothing was applied yet or the person has since tweaked something. */
export function matchingProfileId(settings: Settings): ProfileId | null {
  for (const profile of PROFILES) {
    const keys = Object.keys(profile.apply) as (keyof Settings)[]
    if (keys.every((key) => settings[key] === profile.apply[key])) return profile.id
  }
  return null
}
