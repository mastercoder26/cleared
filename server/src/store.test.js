import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

// Point the store at an isolated temp directory before importing it, since
// the data directory is resolved once at module load.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cleared-store-test-'))
process.env.DATA_DIR = tmpDir

const { readRecord, writeRecord } = await import('./store.js')

test('round-trips a written record', async () => {
  await writeRecord('person-a', { hello: 'world' })
  const read = await readRecord('person-a')
  assert.deepEqual(read, { hello: 'world' })
})

test('missing record returns {}', async () => {
  const read = await readRecord('nobody-here')
  assert.deepEqual(read, {})
})

test('corrupt file returns {} instead of throwing', async () => {
  const crypto = await import('node:crypto')
  const filename = `${crypto.createHash('sha256').update('corrupt-person').digest('hex')}.json`
  await fs.promises.mkdir(tmpDir, { recursive: true })
  await fs.promises.writeFile(path.join(tmpDir, filename), '{not valid json', 'utf8')

  const read = await readRecord('corrupt-person')
  assert.deepEqual(read, {})
})

test('does not mix identities into the same file', async () => {
  await writeRecord('person-b', { a: 1 })
  await writeRecord('person-c', { b: 2 })
  assert.deepEqual(await readRecord('person-b'), { a: 1 })
  assert.deepEqual(await readRecord('person-c'), { b: 2 })
})

test('concurrent writes to the same identity do not lose data', async () => {
  const writes = Array.from({ length: 20 }, (_, i) => writeRecord('person-d', { n: i }))
  await Promise.all(writes)
  const final = await readRecord('person-d')
  // The last write to actually land should be n: 19, since writes are
  // serialized per-identity in call order.
  assert.equal(final.n, 19)
})
