/** Personal scratch notes. Autosaved through the progress hook's own debounce — never sent to Google. */
export function NotesField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <section aria-labelledby="notes-heading" className="notes-field">
      <h2 id="notes-heading" className="notes-field__heading">
        Your notes
      </h2>
      <p className="notes-field__hint">Just for you — never sent to Google or your teacher.</p>
      <textarea
        className="notes-field__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot down anything you want to remember about this one…"
        rows={4}
        maxLength={5000}
        aria-label="Your personal notes about this assignment"
      />
    </section>
  )
}
