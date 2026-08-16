import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

export const repositoryRoot = resolve(import.meta.dirname, '../..')
export const temporaryRoot = () =>
  mkdtempSync(join(tmpdir(), 'rhode-verifier-'))
export const copyPaths = (paths) => {
  const root = temporaryRoot()
  for (const path of paths) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    cpSync(join(repositoryRoot, path), join(root, path), { recursive: true })
  }
  return root
}
export const replaceInFile = (root, path, from, to) => {
  const absolute = join(root, path)
  const source = readFileSync(absolute, 'utf8')
  if (!source.includes(from)) throw new Error(`${path}: mutation source not found`)
  writeFileSync(absolute, source.replace(from, to))
}
export const removePath = (root, path) =>
  rmSync(join(root, path), { recursive: true, force: true })
