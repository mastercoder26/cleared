/** Thin wrapper around the Web Speech API so read-aloud buttons stay simple. */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text: string) {
  if (!speechSupported || !text.trim()) return
  window.speechSynthesis.cancel() // one voice at a time — a second click restarts, doesn't layer
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel()
}
