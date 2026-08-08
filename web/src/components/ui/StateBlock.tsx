/** A consistent loading / empty / error block, so those three states never look ad hoc. */
export function StateBlock({
  kind = 'info',
  title,
  detail,
  action,
}: {
  kind?: 'loading' | 'empty' | 'error' | 'info'
  title: string
  detail?: string
  action?: React.ReactNode
}) {
  return (
    <div className={`state-block state-block--${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      {kind === 'loading' && <span className="spinner" aria-hidden="true" />}
      <p className="state-block__title">{title}</p>
      {detail && <p className="state-block__detail">{detail}</p>}
      {action}
    </div>
  )
}
