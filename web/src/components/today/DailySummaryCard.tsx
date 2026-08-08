import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import { useSettings } from '../../lib/settings'
import type { DailySummary, SummaryTone } from '../../lib/types'
import { ReadAloudButton } from '../ui/ReadAloudButton'
import './today.css'

const TONE_LABEL: Record<SummaryTone, string> = {
  plain: 'Plain',
  encouraging: 'Encouraging',
  brief: 'Brief',
}

/** The AI-written "here's where you stand today" briefing at the top of the Today page. */
export function DailySummaryCard() {
  const { settings, update } = useSettings()
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = (tone: SummaryTone, refresh: boolean) => {
    setLoading(true)
    setError(null)
    api
      .dailySummary(tone, refresh)
      .then((res) => setSummary(res.summary))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Could not build today’s summary.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(settings.summaryTone, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.summaryTone])

  const spoken = summary
    ? [summary.headline, ...summary.highlights, summary.note].filter(Boolean).join('. ')
    : ''

  return (
    <section className="summary-card" aria-labelledby="summary-heading">
      <div className="summary-card__top">
        <h2 id="summary-heading" className="summary-card__eyebrow">
          Today
        </h2>
        <div className="summary-card__tone" role="group" aria-label="Summary tone">
          {(Object.keys(TONE_LABEL) as SummaryTone[]).map((tone) => (
            <button
              key={tone}
              type="button"
              className="summary-card__tone-btn"
              aria-pressed={settings.summaryTone === tone}
              onClick={() => update('summaryTone', tone)}
            >
              {TONE_LABEL[tone]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="summary-card__loading">
          <span className="spinner" aria-hidden="true" />
          Building today's summary…
        </div>
      )}

      {error && !loading && (
        <div className="summary-card__error">
          <p>{error}</p>
          <button type="button" className="btn btn--secondary" onClick={() => load(settings.summaryTone, true)}>
            Try again
          </button>
        </div>
      )}

      {summary && !loading && !error && (
        <>
          <p className="summary-card__headline">{summary.headline}</p>
          {summary.highlights.length > 0 && (
            <ul className="summary-card__highlights">
              {summary.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
          {summary.note && <p className="today-summary__note summary-card__note">{summary.note}</p>}
          <div className="summary-card__actions">
            <ReadAloudButton text={spoken} label="Read summary aloud" />
            <button type="button" className="btn btn--ghost" onClick={() => load(settings.summaryTone, true)}>
              Refresh
            </button>
          </div>
        </>
      )}
    </section>
  )
}
