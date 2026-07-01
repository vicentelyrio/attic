import { createShikiAdapter } from '@mantine/code-highlight'
import { fileExt, fileKind } from '../files'

/**
 * Languages bundled into the shiki highlighter. Each one is dynamically
 * imported by shiki as a separate chunk, so the list stays cheap until a file
 * of that kind is actually previewed. Anything outside this set falls back to
 * plain `text`.
 */
const SHIKI_LANGS = [
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
  'json5',
  'yaml',
  'toml',
  'xml',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'markdown',
  'mdx',
  'rust',
  'go',
  'python',
  'ruby',
  'java',
  'kotlin',
  'c',
  'cpp',
  'csharp',
  'php',
  'swift',
  'bash',
  'sql',
  'lua',
  'r',
  'dart',
  'vue',
  'svelte',
  'ini',
  'dotenv',
] as const

const LOADED = new Set<string>([...SHIKI_LANGS, 'text'])

/** Extensions whose shiki grammar id differs from the raw extension. */
const EXT_TO_LANG: Record<string, string> = {
  mjs: 'js',
  cjs: 'js',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  h: 'c',
  cs: 'csharp',
  sh: 'bash',
  yml: 'yaml',
  htm: 'html',
  md: 'markdown',
  conf: 'ini',
  env: 'dotenv',
  plist: 'xml',
  rtf: 'text',
  txt: 'text',
  log: 'text',
}

/**
 * Categories whose bytes are not human-readable — these never get a text
 * preview. Everything else (including unrecognized extensions) is treated as
 * text and previewed as code, falling back to plain text when no grammar
 * matches.
 */
const BINARY_CATEGORIES = new Set([
  'image',
  'video',
  'audio',
  'pdf',
  'doc',
  'sheet',
  'slide',
  'archive',
  'font',
  'binary',
])

export function isTextFile(name: string): boolean {
  return !BINARY_CATEGORIES.has(fileKind(name).category)
}

/** Heuristic: a NUL byte in the sampled prefix means the file is binary. */
export function looksBinary(text: string): boolean {
  return text.includes('\u0000')
}

/** Resolve a file name to a shiki grammar id that is guaranteed to be loaded. */
export function shikiLang(name: string): string {
  const ext = fileExt(name)
  const lang = EXT_TO_LANG[ext] ?? ext
  return LOADED.has(lang) ? lang : 'text'
}

async function loadShiki() {
  const { createHighlighter } = await import('shiki')
  return createHighlighter({
    langs: SHIKI_LANGS as unknown as string[],
    // Mantine maps highlighting to CSS variables, so no shiki theme is needed.
    themes: [],
  })
}

export const shikiAdapter = createShikiAdapter(loadShiki)
