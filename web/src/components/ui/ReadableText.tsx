import { type ElementType } from 'react'
import { useSettings } from '../../lib/settings'
import './readable-text.css'

interface Props {
  text: string
  as?: ElementType
  className?: string
}

const BOLD_FRACTION = 0.4

function splitTokens(text: string): { value: string; isWord: boolean }[] {
  return text
    .split(/(\s+)/)
    .filter((token) => token.length > 0)
    .map((token) => ({ value: token, isWord: token.trim().length > 0 }))
}

function BionicWord({ word }: { word: string }) {
  const boldLength = Math.max(1, Math.ceil(word.length * BOLD_FRACTION))
  return (
    <span className="rt-word">
      <span className="rt-word__bold">{word.slice(0, boldLength)}</span>
      {word.slice(boldLength)}
    </span>
  )
}

/**
 * Renders `text` in bionic-style reading when the setting is on — bolding
 * the first ~40% of each word as an eye anchor — and falls back to plain
 * text otherwise or when there's nothing to render.
 *
 * Accessibility: the bolding is purely visual. The outer element carries
 * `aria-label={text}` (the real, unfragmented sentence) and the decorative
 * per-word markup is `aria-hidden`, so screen readers announce the whole
 * word normally. Because it's still real DOM text (not an image or canvas),
 * selecting/copying the rendered text works exactly as it would without
 * this component.
 */
export function ReadableText({ text, as: Tag = 'span', className }: Props) {
  const { settings } = useSettings()

  if (!settings.bionicReading || !text) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag className={`readable-text ${className ?? ''}`} aria-label={text}>
      <span aria-hidden="true">
        {splitTokens(text).map((token, i) =>
          token.isWord ? <BionicWord key={i} word={token.value} /> : <span key={i}>{token.value}</span>,
        )}
      </span>
    </Tag>
  )
}
