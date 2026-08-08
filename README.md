# cleared

An AI layer for Google Classroom. It takes a dense, teacher-written assignment
post and gives a student two things Classroom never does on its own: a
plain-language version of what to actually do, and a short list of concrete
steps to get started.

Built for students with dyslexia, ADHD, and other processing differences —
people who read Classroom every day but get stuck before they even start.

## Stack

- **Frontend** — React + TypeScript + Vite, flat/no-gradient design system,
  independently composable accessibility modes.
- **Backend** — Express. Holds the Google OAuth client secret and the
  Anthropic API key server-side; the browser never sees either.
- **Rewrite model** — Claude Opus 5, called with a JSON schema
  (`output_config.format`) so the response always matches what the UI
  expects — no prompt-parsing guesswork.

## Run it

```bash
# backend
cd server
npm install
cp .env.example .env   # fill in values, or leave blank for demo mode
npm run dev

# frontend, in a second terminal
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. With no `.env` values set, sign-in and the
Claude rewrite both fall back to friendly disabled/demo states — the whole
app runs and is fully clickable without any credentials.

### Demo mode

Click **"Try the demo"** on the sign-in screen. It's a small set of realistic
sample classes and assignments (deliberately written the way real Classroom
posts read: dense, run-on, task buried in paragraph three) so the rewrite
step is exercised honestly.

### Turning on real Google Classroom sign-in

1. In [Google Cloud Console](https://console.cloud.google.com), create an
   OAuth 2.0 **Web application** client.
2. Add `http://localhost:8787/api/auth/google/callback` as an authorized
   redirect URI.
3. Enable the **Google Classroom API** for the project.
4. Under **Audience → Test users**, add your own Google account — the scopes
   this app requests (`classroom.courses.readonly`,
   `classroom.coursework.me.readonly`, `classroom.student-submissions.me.readonly`,
   `classroom.announcements.readonly`) are Google-classified as *sensitive*,
   so real (non-test) users can't consent until the app passes Google's
   verification review.
5. Copy the client ID/secret into `server/.env`.

Every Classroom scope the app requests is **read-only** — cleared never
writes to, submits, or modifies anything in a student's Classroom account.

### Turning on the Claude rewrite

Set `ANTHROPIC_API_KEY` in `server/.env`. Without it, the app still runs;
assignment pages show a clear "rewrite unavailable" state instead of failing
silently.

## Project layout

```
server/   Express API — OAuth, Classroom proxy, Claude rewrite, demo data
web/      React app — pages, accessibility system, design tokens
```
