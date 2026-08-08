import { useEffect } from 'react'

export interface HotkeyBinding {
  /** e.g. "mod+k", "?", "escape" — "mod" means Cmd on Mac, Ctrl elsewhere. */
  combo: string
  handler: (event: KeyboardEvent) => void
  /** Fire even while a text input/textarea/contenteditable is focused. Default false. */
  allowInInputs?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function matchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const needsMod = parts.includes('mod')
  const hasMod = event.metaKey || event.ctrlKey
  if (needsMod !== hasMod) return false
  return event.key.toLowerCase() === key
}

/**
 * Registers global keyboard shortcuts. Skips them while a text input is
 * focused unless the binding opts in with `allowInInputs`, so shortcuts
 * never hijack normal typing.
 */
export function useHotkeys(bindings: HotkeyBinding[]) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      for (const binding of bindings) {
        if (!matchesCombo(event, binding.combo)) continue
        if (isEditableTarget(event.target) && !binding.allowInInputs) continue
        event.preventDefault()
        binding.handler(event)
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bindings])
}
