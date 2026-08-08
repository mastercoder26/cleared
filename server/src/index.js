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
import { DEMO_USER, DEMO_COURSES, demoCourseWork, findDemoCourseWork } from './demoData.js'

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

/**
 * The core of the product: hand one assignment to Claude, get back the plain
 * version and the step breakdown. Cached per assignment for the session's
 * lifetime so re-opening a card is instant and costs nothing.
 */
const rewriteCache = new Map()

app.post(
  '/api/simplify',
  route(async (req, res) => {
    const session = await requireSession(req)
    const { courseId, workId, refresh } = req.body ?? {}
    if (!courseId || !workId) {
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

app.listen(config.port, () => {
  console.log(`cleared server → http://localhost:${config.port}`)
  if (!isGoogleConfigured()) console.log('  · Google OAuth not configured — demo mode only')
  if (!isClaudeConfigured()) console.log('  · ANTHROPIC_API_KEY missing — rewrites disabled')
})
