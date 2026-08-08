import { useSettings } from '../../lib/settings'
import { matchingProfileId, PROFILES } from './profiles'
import './profile-selector.css'

/**
 * One-tap starting points. Shows which profile (if any) the current
 * settings match, and "Custom" once they diverge — so it's obvious these
 * are starting points, not locks.
 */
export function ProfileSelector() {
  const { settings, applyMany } = useSettings()
  const activeId = matchingProfileId(settings)

  return (
    <div className="profile-selector">
      <p className="profile-selector__status">
        Currently: <strong>{activeId ? PROFILES.find((p) => p.id === activeId)?.label : 'Custom'}</strong>
      </p>
      <div className="profile-selector__grid">
        {PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            className="profile-selector__card"
            data-active={activeId === profile.id}
            onClick={() => applyMany(profile.apply, profile.id)}
          >
            <span className="profile-selector__label">{profile.label}</span>
            <span className="profile-selector__tagline">{profile.tagline}</span>
          </button>
        ))}
      </div>
      <p className="a11y-hint">
        A profile is a starting point, not a lock — every value it sets can still be changed below.
      </p>
    </div>
  )
}
