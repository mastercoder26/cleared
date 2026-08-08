import { useEffect, useRef } from 'react'
import { useSettings } from '../../lib/settings'
import './reading-ruler.css'

const RULER_HEIGHT = 96

/**
 * A pointer-events-none band that follows the mouse — and, for keyboard
 * users, whatever just received focus — to help hold a place on a dense
 * page. Off / ruler (dims above and below a band) / spotlight (radial dim).
 */
export function ReadingRuler() {
  const { settings } = useSettings()
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const mode = settings.readingRuler

  useEffect(() => {
    if (mode === 'off') return

    const moveTo = (y: number) => {
      if (mode === 'ruler') {
        if (topRef.current) topRef.current.style.height = `${Math.max(y - RULER_HEIGHT / 2, 0)}px`
        if (bottomRef.current) bottomRef.current.style.top = `${y + RULER_HEIGHT / 2}px`
      } else if (spotRef.current) {
        spotRef.current.style.setProperty('--spot-y', `${y}px`)
      }
    }

    const onPointerMove = (event: PointerEvent) => moveTo(event.clientY)
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      const rect = event.target.getBoundingClientRect()
      moveTo(rect.top + rect.height / 2)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('focusin', onFocusIn)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [mode])

  if (mode === 'off') return null

  if (mode === 'spotlight') {
    return <div ref={spotRef} className="reading-spotlight" aria-hidden="true" />
  }

  return (
    <div className="reading-ruler" aria-hidden="true">
      <div ref={topRef} className="reading-ruler__dim reading-ruler__dim--top" />
      <div ref={bottomRef} className="reading-ruler__dim reading-ruler__dim--bottom" />
    </div>
  )
}
