import crypto from 'node:crypto'
import {
  GOOGLE_AUTH_ENDPOINT,
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_REVOKE_ENDPOINT,
  GOOGLE_SCOPES,
  config,
} from './config.js'

/**
 * Step 1 of the web-server OAuth flow.
 * Returns { url, state } — the caller stores `state` in the session and
 * compares it on the callback to block CSRF.
 */
export function buildAuthUrl() {
  const state = crypto.randomBytes(24).toString('hex')
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline', // required to receive a refresh_token
    include_granted_scopes: 'true', // incremental authorization
    prompt: 'consent', // forces a refresh_token even on repeat consent
    state,
  })
  return { url: `${GOOGLE_AUTH_ENDPOINT}?${params}`, state }
}

/** Step 2: trade the one-time `code` for access + refresh tokens. */
export async function exchangeCodeForTokens(code) {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${body.error_description ?? body.error ?? res.status}`)
  }
  return normalizeTokens(body)
}

/** Step 3: swap a refresh token for a fresh access token when the old one expires. */
export async function refreshAccessToken(refreshToken) {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      grant_type: 'refresh_token',
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${body.error_description ?? body.error ?? res.status}`)
  }
  // A refresh response does not include a new refresh_token — keep the old one.
  return { ...normalizeTokens(body), refreshToken }
}

export async function revokeToken(token) {
  if (!token) return
  await fetch(GOOGLE_REVOKE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  }).catch(() => {})
}

function normalizeTokens(body) {
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    // Expire a minute early so an in-flight request never races the deadline.
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 - 60_000,
    scope: body.scope,
  }
}

/**
 * Returns a valid access token for the session, refreshing in place if needed.
 * Mutates `session.tokens` so the refreshed token is persisted by the cookie.
 */
export async function getValidAccessToken(session) {
  const tokens = session.tokens
  if (!tokens?.accessToken) throw new Error('Not signed in')
  if (Date.now() < tokens.expiresAt) return tokens.accessToken
  if (!tokens.refreshToken) throw new Error('Session expired — sign in again')

  const refreshed = await refreshAccessToken(tokens.refreshToken)
  session.tokens = refreshed
  return refreshed.accessToken
}

export async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const body = await res.json()
  return { name: body.name, email: body.email, picture: body.picture }
}
