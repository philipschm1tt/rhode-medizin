import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { temporaryRoot } from './helpers.mjs'
import { readYaml } from '../../scripts/lib/verification.mjs'

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
  assert.equal(readYaml(root, 'content/record.yaml', errors), null)
  assert.match(errors[0], /^content\/record\.yaml: invalid YAML:/)
})
