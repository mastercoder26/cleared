import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface UseFocusTrapOptions {
  active: boolean
  onEscape?: () => void
  /** Restore focus to whatever had it before the trap activated. Default true. */
  restoreFocus?: boolean
}

/**
 * Traps Tab/Shift+Tab focus inside the returned container ref while
 * `active`, calls `onEscape` on the Escape key, and restores focus to
 * whatever was focused beforehand when it deactivates. Used by `Dialog`
 * and available directly for any custom overlay.
 */
export function useFocusTrap<T extends HTMLElement>({
  active,
  onEscape,
  restoreFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const container = containerRef.current

    const focusables = () =>
      container ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : []

    const first = focusables()[0]
    ;(first ?? container)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onEscape?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      if (restoreFocus) previouslyFocused.current?.focus()
    }
  }, [active, onEscape, restoreFocus])

  return containerRef
}
