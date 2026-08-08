import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { Dialog } from './Dialog'
import './command-palette.css'

interface Command {
  id: string
  label: string
  run: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onOpenAccessibilityPanel: () => void
}

/**
 * Cmd+K / Ctrl+K command palette: jump to a page, open the accessibility
 * panel, toggle a few reading settings, start focus mode, or sign out.
 * Full keyboard nav via a listbox pattern (role="combobox" input +
 * role="listbox" results, aria-activedescendant tracks the active option).
 */
export function CommandPalette({ open, onClose, onOpenAccessibilityPanel }: Props) {
  const navigate = useNavigate()
  const { signedIn, signOut } = useAuth()
  const { settings, update } = useSettings()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = 'command-palette-listbox'

  const commands = useMemo<Command[]>(() => {
    const go = (path: string) => () => {
      navigate(path)
      onClose()
    }
    const list: Command[] = [
      { id: 'today', label: 'Go to Today', run: go('/today') },
      { id: 'classes', label: 'Go to Classes', run: go('/courses') },
      { id: 'plan', label: 'Go to Plan', run: go('/plan') },
      {
        id: 'a11y',
        label: 'Open accessibility panel',
        run: () => {
          onClose()
          onOpenAccessibilityPanel()
        },
      },
      {
        id: 'focus-mode',
        label: settings.focusMode ? 'Turn off focus mode' : 'Start focus mode',
        run: () => {
          update('focusMode', !settings.focusMode)
          onClose()
        },
      },
      {
        id: 'reduce-motion',
        label: settings.reduceMotion ? 'Turn motion back on' : 'Reduce motion',
        run: () => {
          update('reduceMotion', !settings.reduceMotion)
          onClose()
        },
      },
      {
        id: 'bionic',
        label: settings.bionicReading ? 'Turn off bionic reading' : 'Turn on bionic reading',
        run: () => {
          update('bionicReading', !settings.bionicReading)
          onClose()
        },
      },
    ]
    if (signedIn) {
      list.push({
        id: 'sign-out',
        label: 'Sign out',
        run: () => {
          onClose()
          void signOut()
        },
      })
    }
    return list
  }, [navigate, onClose, onOpenAccessibilityPanel, settings, update, signedIn, signOut])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    // Fuzzy-ish: every typed character must appear in order in the label.
    return commands.filter((c) => {
      const label = c.label.toLowerCase()
      let i = 0
      for (const ch of q) {
        i = label.indexOf(ch, i)
        if (i === -1) return false
        i += 1
      }
      return true
    })
  }, [commands, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    const raf = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0)
  }, [filtered.length, activeIndex])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      filtered[activeIndex]?.run()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Command palette" className="command-palette-dialog">
      <div className="command-palette">
        <input
          ref={inputRef}
          type="text"
          className="command-palette__input"
          placeholder="Jump to a page or setting…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={filtered[activeIndex] ? `cmd-${filtered[activeIndex].id}` : undefined}
          aria-autocomplete="list"
        />
        <ul id={listId} role="listbox" className="command-palette__list">
          {filtered.length === 0 && <li className="command-palette__empty">No matching commands</li>}
          {filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              id={`cmd-${cmd.id}`}
              role="option"
              aria-selected={i === activeIndex}
              className="command-palette__item"
              data-active={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => cmd.run()}
            >
              {cmd.label}
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}
