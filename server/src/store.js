import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Resolve from the repo root (one level above the server package) so the
// literal default 'server/.data' lands at server/.data regardless of the
// process's cwd — never nested under server/server/.data.
const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = path.resolve(SERVER_ROOT, '..')
const DATA_DIR = path.resolve(REPO_ROOT, process.env.DATA_DIR ?? 'server/.data')

let dirReady = null
const ensureDir = () => {
  dirReady ??= fs.promises.mkdir(DATA_DIR, { recursive: true })
  return dirReady
}

/** Turns an identity (email, or the literal "demo") into a safe, non-reversible filename. */
const identityToFilename = (identity) =>
  `${crypto.createHash('sha256').update(String(identity)).digest('hex')}.json`

// One write queue per identity, so concurrent PUTs serialize instead of racing
// on the same file and losing an update.
const writeQueues = new Map()

const queueWrite = (identity, task) => {
  const previous = writeQueues.get(identity) ?? Promise.resolve()
  const next = previous.then(task, task)
  writeQueues.set(identity, next)
  next.finally(() => {
    if (writeQueues.get(identity) === next) writeQueues.delete(identity)
  })
  return next
}

/** Reads the whole record for one identity. Never throws — a missing or corrupt file is just {}. */
export async function readRecord(identity) {
  await ensureDir()
  const filePath = path.join(DATA_DIR, identityToFilename(identity))
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    console.warn(`[store] corrupt or unreadable record, returning {}: ${err.message}`)
    return {}
  }
}

/** Replaces the whole record for one identity. Caller passes a complete new object. */
export async function writeRecord(identity, obj) {
  await ensureDir()
  const filePath = path.join(DATA_DIR, identityToFilename(identity))
  return queueWrite(identity, async () => {
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
    await fs.promises.writeFile(tmpPath, JSON.stringify(obj), 'utf8')
    await fs.promises.rename(tmpPath, filePath)
    return obj
  })
}

/** The identity key used to namespace a person's stored data. */
export function identityFor(session, sessionUser) {
  if (session.mode === 'demo') return 'demo'
  return sessionUser?.email ?? 'unknown'
}
