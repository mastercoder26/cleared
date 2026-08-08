interface Props {
  total: number
  currentIndex: number
  visibleIndex: number
  completed: Set<number>
}

/** Where you are in the sequence, without listing every remaining task like a wall. */
export function FocusProgressRail({ total, currentIndex, visibleIndex, completed }: Props) {
  return (
    <div className="focus-rail-wrap">
      <p className="focus-rail__label">
        Step {currentIndex + 1} of {total}
      </p>
      <div className="focus-rail" role="list" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            role="listitem"
            className="focus-rail__dot"
            data-state={completed.has(i) ? 'done' : i === visibleIndex ? 'current' : 'pending'}
          />
        ))}
      </div>
    </div>
  )
}
