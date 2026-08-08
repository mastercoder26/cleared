import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

interface AnnounceOptions {
  /** Interrupts the current screen-reader utterance instead of waiting politely. Use sparingly. */
  assertive?: boolean
}

interface LiveRegionContextValue {
  announce: (message: string, options?: AnnounceOptions) => void
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

// Give React a beat to clear-then-set so the same message announced twice in
// a row still fires — most screen readers only announce on a text change.
const RESET_DELAY_MS = 50

/**
 * Mounts two visually-hidden `aria-live` regions (polite + assertive — two
 * separate nodes, not one with a toggled attribute, since screen readers
 * cache a region's politeness at mount) so any component can announce a
 * status update ("Step 2 of 5 complete", "Rewrite ready") via `useAnnounce()`
 * without owning any DOM of its own. Mounted once, inside AppShell.
 */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const timeoutRef = useRef<number | undefined>(undefined)

  const announce = useCallback((message: string, options?: AnnounceOptions) => {
    const setText = options?.assertive ? setAssertive : setPolite
    setText('')
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setText(message), RESET_DELAY_MS)
  }, [])

  const value = useMemo<LiveRegionContextValue>(() => ({ announce }), [announce])

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="visually-hidden">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="visually-hidden">
        {assertive}
      </div>
    </LiveRegionContext.Provider>
  )
}

export function useAnnounce() {
  const ctx = useContext(LiveRegionContext)
  if (!ctx) throw new Error('useAnnounce must be used within LiveRegionProvider')
  return ctx.announce
}
