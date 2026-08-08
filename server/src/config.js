import 'dotenv/config'

/**
 * Read-only Classroom scopes. Everything here is "view" access — cleared never
 * writes to a student's Classroom account.
 *
 * These are *sensitive* scopes: Google requires OAuth app verification before
 * users outside your test-user list can grant them. Until then, add each tester
 * under "Audience > Test users" in the Google Cloud console.
 */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
]

export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
export const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'
export const CLASSROOM_API = 'https://classroom.googleapis.com/v1'

export const config = {
  port: Number(process.env.PORT ?? 8787),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-insecure-secret',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:8787/api/auth/google/callback',
  },
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
}

/** True when Google OAuth is fully configured; otherwise the app runs in demo mode. */
export const isGoogleConfigured = () =>
  Boolean(config.google.clientId && config.google.clientSecret)

export const isClaudeConfigured = () => Boolean(config.anthropicKey)
