import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import yaml from 'yaml'

export const readText = (root, path) =>
  readFileSync(resolve(root, path), 'utf8')

export const readYaml = (root, path, errors) => {
  try {
    return yaml.parse(readText(root, path))
  } catch (error) {
    errors.push(`${toPosix(path)}: invalid YAML: ${error.message}`)
    return null
  }
}

export const listFiles = (root, dir, extension) => {
  const absoluteDir = resolve(root, dir)
  const files = []

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const path = join(absoluteDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(root, relative(root, path), extension))
    } else if (!extension || extname(entry.name) === extension) {
      files.push(toPosix(relative(root, path)))
    }
  }

  return files.sort()
}

export const toPosix = (path) => path.replaceAll('\\', '/')

export const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

export const resolveContentImage = (recordPath, imagePath) =>
  toPosix(join(dirname(recordPath), imagePath))

export const sha256 = (buffer) =>
  createHash('sha256').update(buffer).digest('hex')

export const scanActiveSources = (root) => {
  const paths = [
    'src/pages',
    'src/content',
    'src/components',
    'src/layouts',
    'src/content.config.ts',
    'astro.config.mjs',
  ]

  return paths.flatMap((path) =>
    statSync(resolve(root, path)).isDirectory() ? listFiles(root, path) : path,
  )
}

export const isDirectExecution = (url) =>
  Boolean(
    process.argv[1] &&
      pathToFileURL(resolve(process.argv[1])).href === url,
  )

export const runCli = async (label, verify) => {
  try {
    const errors = await verify()
    for (const error of errors) console.error(error)
    if (errors.length > 0) process.exitCode = 1
  } catch (error) {
    console.error(`${label}: ${error.message}`)
    process.exitCode = 1
  }
}
