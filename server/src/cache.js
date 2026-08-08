const DEFAULT_MAX_ENTRIES = 500

/**
 * A tiny bounded LRU cache backed by a Map (insertion order == recency
 * order). Used for the model-response caches so a long-running server
 * doesn't grow an unbounded Map per route.
 */
export class LruCache {
  #maxEntries
  #map = new Map()

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.#maxEntries = maxEntries
  }

  has(key) {
    return this.#map.has(key)
  }

  get(key) {
    if (!this.#map.has(key)) return undefined
    const value = this.#map.get(key)
    // Refresh recency by re-inserting at the end.
    this.#map.delete(key)
    this.#map.set(key, value)
    return value
  }

  set(key, value) {
    if (this.#map.has(key)) this.#map.delete(key)
    this.#map.set(key, value)
    if (this.#map.size > this.#maxEntries) {
      const oldestKey = this.#map.keys().next().value
      this.#map.delete(oldestKey)
    }
    return value
  }

  get size() {
    return this.#map.size
  }
}
