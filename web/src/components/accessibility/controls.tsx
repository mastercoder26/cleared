/** Shared presentational bits used across the accessibility panel's sections. */
export function ChoiceButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className="a11y-choice" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  )
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="a11y-toggle-row">
      <div>
        <p className="a11y-toggle-label">{label}</p>
        <p className="a11y-hint">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="a11y-switch"
        data-on={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="a11y-switch__thumb" />
      </button>
    </div>
  )
}
