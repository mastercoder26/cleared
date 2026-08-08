const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX_REQUESTS = 10

/**
 * A simple in-memory sliding-window rate limiter keyed by an arbitrary
 * string (session identity). One instance guards one route or route group.
 */
export class RateLimiter {
  #windowMs
  #maxRequests
  #hits = new Map()

  constructor({ windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS } = {}) {
    this.#windowMs = windowMs
    this.#maxRequests = maxRequests
  }

  /** Returns true and records the hit if under the limit; false if the caller should be rejected. */
  tryConsume(key) {
    const now = Date.now()
    const windowStart = now - this.#windowMs
    const recent = (this.#hits.get(key) ?? []).filter((t) => t > windowStart)

    if (recent.length >= this.#maxRequests) {
      this.#hits.set(key, recent)
      return false
    }

    recent.push(now)
    this.#hits.set(key, recent)
    return true
  }
}

/** Express middleware factory: 429s with a friendly message once a key exceeds its budget. */
export function rateLimit(limiter, keyFn) {
  return (req, res, next) => {
    const key = keyFn(req)
    if (limiter.tryConsume(key)) return next()
    res.status(429).json({
      error: "You're sending requests a little too fast. Wait a moment and try again.",
    })
  }
}
