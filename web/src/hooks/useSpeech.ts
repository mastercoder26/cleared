import { useCallback, useEffect, useRef, useState } from 'react'
import { speechController, speechSupported, type SpeechState, type WordRange } from '../lib/speak'
import { useSettings } from '../lib/settings'

interface UseSpeechResult {
  state: SpeechState
  wordRange: WordRange | null
  voices: SpeechSynthesisVoice[]
  supported: boolean
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
}

/**
 * React binding for the shared `speechController`. Subscribes to state,
 * word-boundary, and voice-list changes, and stops speech on unmount so it
 * never outlives the component that started it.
 */
export function useSpeech(text: string): UseSpeechResult {
  const { settings } = useSettings()
  const [state, setState] = useState<SpeechState>(speechController.getState())
  const [wordRange, setWordRange] = useState<WordRange | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(speechController.getVoices())
  const textRef = useRef(text)
  textRef.current = text

  useEffect(() => {
    const offState = speechController.onStateChange(setState)
    const offBoundary = speechController.onBoundary(setWordRange)
    const offVoices = speechController.onVoicesChanged(setVoices)
    return () => {
      offState()
      offBoundary()
      offVoices()
    }
  }, [])

  useEffect(() => () => speechController.stop(), [])

  const play = useCallback(() => {
    speechController.speak(textRef.current, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.speechVoiceURI,
    })
  }, [settings.speechRate, settings.speechPitch, settings.speechVoiceURI])

  const pause = useCallback(() => speechController.pause(), [])
  const resume = useCallback(() => speechController.resume(), [])
  const stop = useCallback(() => speechController.stop(), [])

  return { state, wordRange, voices, supported: speechSupported, play, pause, resume, stop }
}
