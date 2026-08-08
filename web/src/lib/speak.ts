/**
 * Text-to-speech controller wrapping the Web Speech API.
 *
 * Exports `speak`/`stopSpeaking`/`speechSupported` for back-compat with the
 * original 15-line stub — every existing import keeps working unchanged —
 * plus a singleton `speechController` that `useSpeech` (hooks/useSpeech.ts)
 * subscribes to for state, word-boundary highlighting, and voice lists.
 *
 * Handles the well-known Web Speech quirks:
 *  - voices load asynchronously, so callers subscribe via onVoicesChanged
 *    rather than reading getVoices() once
 *  - Chrome silently stops utterances beyond ~15s of speech; text is
 *    chunked so no single utterance runs that long
 *  - cancel()-then-speak() races are guarded with a generation counter —
 *    a stale utterance's callbacks are ignored once superseded
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export type SpeechState = 'idle' | 'speaking' | 'paused'

export interface WordRange {
  start: number
  end: number
}

interface SpeakOptions {
  rate?: number
  pitch?: number
  voiceURI?: string | null
}

interface TextChunk {
  text: string
  offset: number
}

const MAX_CHUNK_CHARS = 180

function chunkText(text: string): TextChunk[] {
  const chunks: TextChunk[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_CHARS, text.length)
    if (end < text.length) {
      const lastSpace = Math.max(text.lastIndexOf(' ', end), text.lastIndexOf('\n', end))
      if (lastSpace > start) end = lastSpace + 1
    }
    chunks.push({ text: text.slice(start, end), offset: start })
    start = end
  }
  return chunks.length ? chunks : [{ text, offset: 0 }]
}

type StateListener = (state: SpeechState) => void
type BoundaryListener = (range: WordRange | null) => void
type VoicesListener = (voices: SpeechSynthesisVoice[]) => void

class SpeechController {
  private chunks: TextChunk[] = []
  private chunkIndex = 0
  private generation = 0
  private state: SpeechState = 'idle'
  private voices: SpeechSynthesisVoice[] = []
  private rate = 1
  private pitch = 1
  private voice: SpeechSynthesisVoice | null = null

  private stateListeners = new Set<StateListener>()
  private boundaryListeners = new Set<BoundaryListener>()
  private voicesListeners = new Set<VoicesListener>()

  constructor() {
    if (!speechSupported) return
    this.refreshVoices()
    window.speechSynthesis.addEventListener('voiceschanged', this.refreshVoices)
    // Never let an utterance outlive the tab.
    window.addEventListener('pagehide', this.stop)
  }

  private refreshVoices = () => {
    this.voices = window.speechSynthesis.getVoices()
    this.voicesListeners.forEach((listener) => listener(this.voices))
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  getState(): SpeechState {
    return this.state
  }

  onVoicesChanged(listener: VoicesListener): () => void {
    this.voicesListeners.add(listener)
    return () => this.voicesListeners.delete(listener)
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  onBoundary(listener: BoundaryListener): () => void {
    this.boundaryListeners.add(listener)
    return () => this.boundaryListeners.delete(listener)
  }

  private setState(state: SpeechState) {
    this.state = state
    this.stateListeners.forEach((listener) => listener(state))
  }

  speak(text: string, options: SpeakOptions = {}) {
    if (!speechSupported || !text.trim()) return
    window.speechSynthesis.cancel()
    this.generation += 1
    this.chunks = chunkText(text)
    this.chunkIndex = 0
    this.rate = options.rate ?? this.rate
    this.pitch = options.pitch ?? this.pitch
    if (options.voiceURI !== undefined) {
      this.voice = options.voiceURI
        ? (this.voices.find((v) => v.voiceURI === options.voiceURI) ?? null)
        : null
    }
    this.playFrom(this.generation)
  }

  private playFrom(generation: number) {
    if (generation !== this.generation) return // superseded by a newer speak() call
    const chunk = this.chunks[this.chunkIndex]
    if (!chunk) {
      this.setState('idle')
      this.boundaryListeners.forEach((listener) => listener(null))
      return
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text)
    utterance.rate = this.rate
    utterance.pitch = this.pitch
    if (this.voice) utterance.voice = this.voice

    utterance.onboundary = (event) => {
      if (generation !== this.generation) return
      const start = chunk.offset + event.charIndex
      const length = Math.max(event.charLength ?? 1, 1)
      this.boundaryListeners.forEach((listener) => listener({ start, end: start + length }))
    }
    utterance.onend = () => {
      if (generation !== this.generation) return
      this.chunkIndex += 1
      this.playFrom(generation)
    }
    utterance.onerror = () => {
      if (generation !== this.generation) return
      this.setState('idle')
    }

    this.setState('speaking')
    window.speechSynthesis.speak(utterance)
  }

  pause() {
    if (!speechSupported || this.state !== 'speaking') return
    window.speechSynthesis.pause()
    this.setState('paused')
  }

  resume() {
    if (!speechSupported || this.state !== 'paused') return
    window.speechSynthesis.resume()
    this.setState('speaking')
  }

  stop = () => {
    if (!speechSupported) return
    this.generation += 1 // invalidates any in-flight utterance callbacks
    window.speechSynthesis.cancel()
    this.setState('idle')
    this.boundaryListeners.forEach((listener) => listener(null))
  }
}

export const speechController = new SpeechController()

/** Back-compat wrapper — fires a one-shot utterance with the last-used voice/rate/pitch. */
export function speak(text: string) {
  speechController.speak(text)
}

/** Back-compat wrapper. */
export function stopSpeaking() {
  speechController.stop()
}
