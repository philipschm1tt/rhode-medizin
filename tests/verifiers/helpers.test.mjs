import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { temporaryRoot } from './helpers.mjs'
import {
  READ_YAML_ERROR,
  readYaml,
  runCli,
} from '../../scripts/lib/verification.mjs'

test('readYaml parses mappings', () => {
  const root = temporaryRoot()
  mkdirSync(join(root, 'content'), { recursive: true })
  writeFileSync(join(root, 'content/record.yaml'), 'order: 1\nname: Example\n')
  const errors = []
  assert.deepEqual(readYaml(root, 'content/record.yaml', errors), {
    order: 1,
    name: 'Example',
  })
  assert.deepEqual(errors, [])
})

test('readYaml reports malformed YAML without throwing', () => {
  const root = temporaryRoot()
  mkdirSync(join(root, 'content'), { recursive: true })
  writeFileSync(join(root, 'content/record.yaml'), 'name: [broken\n')
  const errors = []
  assert.equal(readYaml(root, 'content/record.yaml', errors), READ_YAML_ERROR)
  assert.match(errors[0], /^content\/record\.yaml: invalid YAML:/)
})

test('readYaml preserves valid YAML null', () => {
  const root = temporaryRoot()
  mkdirSync(join(root, 'content'), { recursive: true })
  writeFileSync(join(root, 'content/record.yaml'), 'null\n')
  const errors = []
  assert.equal(readYaml(root, 'content/record.yaml', errors), null)
  assert.deepEqual(errors, [])
})

test('runCli accepts verifier results and prints their summary', async () => {
  const messages = []
  const originalLog = console.log
  console.log = (message) => messages.push(message)
  try {
    await runCli('verify:content', async () => ({
      errors: [],
      summary: '1 employee, 1 page',
    }))
  } finally {
    console.log = originalLog
  }
  assert.deepEqual(messages, ['verify:content: ok (1 employee, 1 page)'])
})
