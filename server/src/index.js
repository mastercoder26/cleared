import express from 'express'
import cookieSession from 'cookie-session'
import { config, isGoogleConfigured, isClaudeConfigured } from './config.js'
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  getValidAccessToken,
  fetchGoogleProfile,
  revokeToken,
} from './googleAuth.js'
import { listCourses, listCourseWork, getCourseWork } from './classroom.js'
import { simplifyAssignment } from './simplify.js'
import { buildTodo } from './todo.js'
import { generateDailySummary } from './dailySummary.js'
import { DEMO_USER, DEMO_COURSES, demoCourseWork, findDemoCourseWork } from './demoData.js'
import { identityFor } from './store.js'
import { getAllProgress, saveProgress } from './progress.js'
import { getUnstuckHelp } from './unstick.js'
import { buildPlan } from './plan.js'
import { buildWorkload } from './workload.js'
import { LruCache } from './cache.js'
import { RateLimiter, rateLimit } from './rateLimit.js'

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(
  cookieSession({
    name: 'cleared.sid',
    secret: config.sessionSecret,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }),
)

// The Vite dev server runs on a different origin, so allow credentialed calls from it.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', config.webOrigin)
  res.set('Access-Control-Allow-Credentials', 'true')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Baseline security headers on every response.
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Referrer-Policy', 'no-referrer')
  res.set('X-Frame-Options', 'DENY')
  next()
})

const isDemo = (req) => req.session?.demo === true
const isSignedIn = (req) => Boolean(req.session?.tokens?.accessToken)

/** Wraps a handler so a thrown error becomes a JSON body instead of an HTML stack. */
const route = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (err) {
    const status = err.status ?? 500
    if (status === 401 || /not signed in|sign in again/i.test(err.message)) {
      req.session = null
      return res.status(401).json({ error: 'Your session expired. Sign in again.' })
    }
    console.error(`[${req.method} ${req.path}]`, err.message)
    res.status(status).json({ error: err.message })
  }
}

/** Resolves the caller to either a live Classroom session or the demo dataset. */
const requireSession = async (req) => {
  if (isDemo(req)) return { mode: 'demo' }
  if (!isSignedIn(req)) {
    const err = new Error('Not signed in')
    err.status = 401
    throw err
  }
  return { mode: 'live', accessToken: await getValidAccessToken(req.session) }
}

// ---------------------------------------------------------------- auth

app.get(
  '/api/me',
  route(async (req, res) => {
    res.json({
      user: req.session?.user ?? null,
      demo: isDemo(req),
      googleConfigured: isGoogleConfigured(),
      claudeConfigured: isClaudeConfigured(),
    })
  }),
)

app.get(
  '/api/auth/google',
  route(async (req, res) => {
    if (!isGoogleConfigured()) {
      return res
        .status(503)
        .json({ error: 'Google sign-in is not configured on this server. Use demo mode.' })
    }
    const { url, state } = buildAuthUrl()
    req.session.oauthState = state
    res.json({ url })
  }),
)

app.get(
  '/api/auth/google/callback',
  route(async (req, res) => {
    const { code, state, error } = req.query
    const fail = (reason) =>
      res.redirect(`${config.webOrigin}/?auth_error=${encodeURIComponent(reason)}`)

    if (error) return fail(String(error))
    // State must round-trip exactly — this is the CSRF check.
    if (!state || state !== req.session?.oauthState) return fail('Sign-in link expired. Try again.')
    if (!code) return fail('No authorization code returned.')

    req.session.oauthState = undefined
    const tokens = await exchangeCodeForTokens(String(code))
    req.session.tokens = tokens
    req.session.demo = false
    req.session.user = await fetchGoogleProfile(tokens.accessToken)
    res.redirect(config.webOrigin)
  }),
)

app.post(
  '/api/auth/demo',
  route(async (req, res) => {
    req.session.demo = true
    req.session.tokens = undefined
    req.session.user = DEMO_USER
    res.json({ user: DEMO_USER, demo: true })
  }),
)

app.post(
  '/api/auth/signout',
  route(async (req, res) => {
    await revokeToken(req.session?.tokens?.refreshToken ?? req.session?.tokens?.accessToken)
    req.session = null
    res.json({ ok: true })
  }),
)

// ---------------------------------------------------------------- classroom

app.get(
  '/api/courses',
  route(async (req, res) => {
    const session = await requireSession(req)
    const courses =
      session.mode === 'demo' ? DEMO_COURSES : await listCourses(session.accessToken)
    res.json({ courses })
  }),
)

app.get(
  '/api/courses/:courseId/coursework',
  route(async (req, res) => {
    const session = await requireSession(req)
    const items =
      session.mode === 'demo'
        ? demoCourseWork(req.params.courseId)
        : await listCourseWork(session.accessToken, req.params.courseId)
    res.json({ courseWork: items })
  }),
)

app.get(
  '/api/courses/:courseId/coursework/:workId',
  route(async (req, res) => {
    const session = await requireSession(req)
    const { courseId, workId } = req.params
    const item =
      session.mode === 'demo'
        ? findDemoCourseWork(courseId, workId)
        : await getCourseWork(session.accessToken, courseId, workId)
    if (!item) return res.status(404).json({ error: 'Assignment not found.' })
    res.json({ courseWork: item })
  }),
)

// ---------------------------------------------------------------- helpers

const MAX_ID_LENGTH = 200
const isSaneId = (value) => typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH

const requestIdentity = (req, session) => identityFor(session, req.session?.user)

// Model-backed routes are the expensive, abusable ones — a small sliding
// window per identity is enough to stop runaway retries without needing a
// new dependency.
const MODEL_ROUTE_WINDOW_MS = 60_000
const MODEL_ROUTE_MAX_REQUESTS = 12
const modelRouteLimiter = new RateLimiter({
  windowMs: MODEL_ROUTE_WINDOW_MS,
  maxRequests: MODEL_ROUTE_MAX_REQUESTS,
})
const limitModelRoute = rateLimit(modelRouteLimiter, (req) =>
  req.session?.demo ? 'demo' : req.session?.user?.email ?? req.ip,
)

/**
 * The core of the product: hand one assignment to Claude, get back the plain
 * version and the step breakdown. Cached per assignment for the session's
 * lifetime so re-opening a card is instant and costs nothing.
 */
const rewriteCache = new LruCache()

app.post(
  '/api/simplify',
  limitModelRoute,
  route(async (req, res) => {
    const session = await requireSession(req)
    const { courseId, workId, refresh } = req.body ?? {}
    if (!isSaneId(courseId) || !isSaneId(workId)) {
      return res.status(400).json({ error: 'courseId and workId are required.' })
    }
    if (!isClaudeConfigured()) {
      return res.status(503).json({
        error: 'The rewrite needs an Anthropic API key. Add ANTHROPIC_API_KEY to server/.env.',
      })
    }

    const assignment =
      session.mode === 'demo'
        ? findDemoCourseWork(courseId, workId)
        : await getCourseWork(session.accessToken, courseId, workId)
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' })

    const courses =
      session.mode === 'demo' ? DEMO_COURSES : await listCourses(session.accessToken)
    const course = courses.find((c) => c.id === courseId) ?? null

    const cacheKey = `${courseId}:${workId}:${assignment.description.length}`
    if (!refresh && rewriteCache.has(cacheKey)) {
      return res.json({ rewrite: rewriteCache.get(cacheKey), cached: true })
    }

    const rewrite = await simplifyAssignment(assignment, course)
    rewriteCache.set(cacheKey, rewrite)
    res.json({ rewrite, cached: false })
  }),
)

// ---------------------------------------------------------------- today / to-do

app.get(
  '/api/todo',
  route(async (req, res) => {
    const session = await requireSession(req)
    const { courses, items } = await buildTodo(session)
    res.json({ courses, items })
  }),
)

/**
 * The daily briefing shown at the top of the Today page. Cached per
 * user/mode/day/tone so re-opening the page during the same day is instant —
 * a new one is only generated once a day, or when the person picks a
 * different tone, or asks to refresh explicitly.
 */
const summaryCache = new LruCache()

app.post(
  '/api/daily-summary',
  limitModelRoute,
  route(async (req, res) => {
    const session = await requireSession(req)
    const tone = ['plain', 'encouraging', 'brief'].includes(req.body?.tone) ? req.body.tone : 'plain'
    const refresh = Boolean(req.body?.refresh)

    if (!isClaudeConfigured()) {
      return res.status(503).json({
        error: 'The daily summary needs an Anthropic API key. Add ANTHROPIC_API_KEY to server/.env.',
      })
    }

    const identity = requestIdentity(req, session)
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `${identity}:${today}:${tone}`
    if (!refresh && summaryCache.has(cacheKey)) {
      return res.json({ summary: summaryCache.get(cacheKey), cached: true })
    }

    const { items } = await buildTodo(session)
    const summary = await generateDailySummary(items, tone)
    summaryCache.set(cacheKey, summary)
    res.json({ summary, cached: false })
  }),
)

// ---------------------------------------------------------------- progress

app.get(
  '/api/progress',
  route(async (req, res) => {
    const session = await requireSession(req)
    const progress = await getAllProgress(requestIdentity(req, session))
    res.json({ progress })
  }),
)

app.put(
  '/api/progress/:workId',
  route(async (req, res) => {
    const session = await requireSession(req)
    const { workId } = req.params
    const { courseId, ...patch } = req.body ?? {}
    if (!isSaneId(workId)) return res.status(400).json({ error: 'workId is required.' })
    const progress = await saveProgress(requestIdentity(req, session), workId, courseId, patch)
    res.json({ progress })
  }),
)

// ---------------------------------------------------------------- unstick

const VALID_FEELINGS = ['dont-understand', 'too-big', 'cant-start', 'lost-interest']
const MAX_TRIED_LENGTH = 2000

app.post(
  '/api/unstick',
  limitModelRoute,
  route(async (req, res) => {
    const session = await requireSession(req)
    const { courseId, workId, stepIndex, tried, feeling } = req.body ?? {}

    if (!isSaneId(courseId) || !isSaneId(workId)) {
      return res.status(400).json({ error: 'courseId and workId are required.' })
    }
    if (!VALID_FEELINGS.includes(feeling)) {
      return res.status(400).json({ error: `feeling must be one of: ${VALID_FEELINGS.join(', ')}` })
    }
    if (stepIndex != null && (!Number.isInteger(stepIndex) || stepIndex < 0)) {
      return res.status(400).json({ error: 'stepIndex must be a non-negative integer or null.' })
    }
    const triedText = typeof tried === 'string' ? tried.slice(0, MAX_TRIED_LENGTH) : ''
    if (!isClaudeConfigured()) {
      return res.status(503).json({
        error: 'Getting unstuck needs an Anthropic API key. Add ANTHROPIC_API_KEY to server/.env.',
      })
    }

    const assignment =
      session.mode === 'demo'
        ? findDemoCourseWork(courseId, workId)
        : await getCourseWork(session.accessToken, courseId, workId)
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' })

    const courses =
      session.mode === 'demo' ? DEMO_COURSES : await listCourses(session.accessToken)
    const course = courses.find((c) => c.id === courseId) ?? null
    const step = stepIndex != null ? { index: stepIndex, action: `step ${stepIndex + 1}`, detail: '' } : null

    const help = await getUnstuckHelp({ assignment, course, step, tried: triedText, feeling })
    res.json({ help })
  }),
)

// ---------------------------------------------------------------- plan

const planCache = new LruCache()

app.post(
  '/api/plan',
  limitModelRoute,
  route(async (req, res) => {
    const session = await requireSession(req)
    const { courseId, workId, refresh } = req.body ?? {}
    if (!isSaneId(courseId) || !isSaneId(workId)) {
      return res.status(400).json({ error: 'courseId and workId are required.' })
    }
    if (!isClaudeConfigured()) {
      return res.status(503).json({
        error: 'The plan needs an Anthropic API key. Add ANTHROPIC_API_KEY to server/.env.',
      })
    }

    const assignment =
      session.mode === 'demo'
        ? findDemoCourseWork(courseId, workId)
        : await getCourseWork(session.accessToken, courseId, workId)
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' })

    const courses =
      session.mode === 'demo' ? DEMO_COURSES : await listCourses(session.accessToken)
    const course = courses.find((c) => c.id === courseId) ?? null

    const cacheKey = `${courseId}:${workId}:${assignment.dueAt ?? 'none'}`
    if (!refresh && planCache.has(cacheKey)) {
      return res.json({ plan: planCache.get(cacheKey), cached: true })
    }

    let steps = []
    try {
      const rewrite = await simplifyAssignment(assignment, course)
      steps = rewrite.steps
    } catch {
      // Planning still works from the raw description if the rewrite fails.
      steps = []
    }

    const plan = await buildPlan({ assignment, course, steps })
    planCache.set(cacheKey, plan)
    res.json({ plan, cached: false })
  }),
)

// ---------------------------------------------------------------- workload

const DEFAULT_WORKLOAD_DAYS = 14
const MIN_WORKLOAD_DAYS = 1
const MAX_WORKLOAD_DAYS = 60

app.get(
  '/api/workload',
  route(async (req, res) => {
    const session = await requireSession(req)
    const requested = Number.parseInt(req.query.days, 10)
    const days = Number.isInteger(requested)
      ? Math.min(MAX_WORKLOAD_DAYS, Math.max(MIN_WORKLOAD_DAYS, requested))
      : DEFAULT_WORKLOAD_DAYS

    const { items } = await buildTodo(session)
    const workloadDays = buildWorkload(items, days)
    res.json({ days: workloadDays })
  }),
)

// ---------------------------------------------------------------- health

app.get(
  '/api/health',
  route(async (req, res) => {
    res.json({ ok: true, google: isGoogleConfigured(), claude: isClaudeConfigured() })
  }),
)

app.listen(config.port, () => {
  console.log(`cleared server → http://localhost:${config.port}`)
  if (!isGoogleConfigured()) console.log('  · Google OAuth not configured — demo mode only')
  if (!isClaudeConfigured()) console.log('  · ANTHROPIC_API_KEY missing — rewrites disabled')
})
