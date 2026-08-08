import { Dialog } from './Dialog'
import './shortcuts-sheet.css'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: '⌘K / Ctrl+K', description: 'Open the command palette' },
  { keys: '?', description: 'Show this shortcuts sheet' },
  { keys: 'Esc', description: 'Close the open panel or dialog' },
  { keys: 'Tab / Shift+Tab', description: 'Move focus inside an open dialog' },
]

/** Opened with the "?" key. A quick reference, not a full manual. */
export function ShortcutsSheet({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" className="shortcuts-sheet-dialog">
      <ul className="shortcuts-sheet__list">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="shortcuts-sheet__row">
            <kbd className="shortcuts-sheet__keys">{s.keys}</kbd>
            <span>{s.description}</span>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
