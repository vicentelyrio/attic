const KIND_COLORS = {
  image: '#57ab5a',
  video: '#e5704b',
  audio: '#bd7af0',
  pdf: '#ef5350',
  doc: '#4d8ef7',
  sheet: '#3fa45b',
  slide: '#e08a3c',
  code: '#6ea8fe',
  markup: '#e0823d',
  data: '#45b8c4',
  markdown: '#57ab5a',
  archive: '#a371f7',
  font: '#c77dff',
  binary: '#9aa0aa',
  model: '#4db6ac',
  text: '#8b909a',
} as const

/** Broad grouping, also shown verbatim on file placeholders. */
export type Category = keyof typeof KIND_COLORS | 'folder' | 'file'

const k = <K extends string>(key: K, category: keyof typeof KIND_COLORS) => ({
  key,
  category,
  color: KIND_COLORS[category],
})

const KINDS = {
  // Images
  jpg: k('jpegImage', 'image'),
  jpeg: k('jpegImage', 'image'),
  png: k('pngImage', 'image'),
  gif: k('gifImage', 'image'),
  webp: k('webpImage', 'image'),
  svg: k('svgImage', 'image'),
  bmp: k('bitmapImage', 'image'),
  tiff: k('tiffImage', 'image'),
  tif: k('tiffImage', 'image'),
  ico: k('icon', 'image'),
  heic: k('heicImage', 'image'),
  avif: k('avifImage', 'image'),
  raw: k('rawImage', 'image'),

  // Video
  mp4: k('mpeg4Movie', 'video'),
  m4v: k('mpeg4Movie', 'video'),
  mov: k('quicktimeMovie', 'video'),
  mkv: k('matroskaVideo', 'video'),
  avi: k('aviVideo', 'video'),
  webm: k('webmVideo', 'video'),
  flv: k('flashVideo', 'video'),
  wmv: k('windowsMediaVideo', 'video'),
  mpg: k('mpegVideo', 'video'),
  mpeg: k('mpegVideo', 'video'),
  '3gp': k('threeGpVideo', 'video'),

  // Audio
  mp3: k('mp3Audio', 'audio'),
  wav: k('wavAudio', 'audio'),
  flac: k('flacAudio', 'audio'),
  aac: k('aacAudio', 'audio'),
  ogg: k('oggAudio', 'audio'),
  m4a: k('mpeg4Audio', 'audio'),
  wma: k('windowsMediaAudio', 'audio'),
  opus: k('opusAudio', 'audio'),
  aiff: k('aiffAudio', 'audio'),

  // Documents
  pdf: k('pdfDocument', 'pdf'),
  doc: k('wordDocument', 'doc'),
  docx: k('wordDocument', 'doc'),
  odt: k('openDocumentText', 'doc'),
  rtf: k('richText', 'text'),
  txt: k('plainText', 'text'),
  xls: k('excelSpreadsheet', 'sheet'),
  xlsx: k('excelSpreadsheet', 'sheet'),
  ods: k('openDocumentSheet', 'sheet'),
  ppt: k('powerpointPresentation', 'slide'),
  pptx: k('powerpointPresentation', 'slide'),
  odp: k('openDocumentSlides', 'slide'),
  epub: k('epubBook', 'doc'),

  // Markdown
  md: k('markdown', 'markdown'),
  markdown: k('markdown', 'markdown'),
  mdx: k('mdx', 'markdown'),

  // Code
  js: k('javascript', 'code'),
  mjs: k('javascript', 'code'),
  cjs: k('javascript', 'code'),
  jsx: k('javascriptReact', 'code'),
  ts: k('typescript', 'code'),
  tsx: k('typescriptReact', 'code'),
  go: k('goSource', 'code'),
  rs: k('rustSource', 'code'),
  py: k('pythonSource', 'code'),
  rb: k('rubySource', 'code'),
  java: k('javaSource', 'code'),
  kt: k('kotlinSource', 'code'),
  c: k('cSource', 'code'),
  h: k('cHeader', 'code'),
  cpp: k('cppSource', 'code'),
  cc: k('cppSource', 'code'),
  cxx: k('cppSource', 'code'),
  hpp: k('cppHeader', 'code'),
  cs: k('csharpSource', 'code'),
  php: k('phpSource', 'code'),
  swift: k('swiftSource', 'code'),
  sh: k('shellScript', 'code'),
  bash: k('shellScript', 'code'),
  sql: k('sql', 'code'),
  lua: k('luaSource', 'code'),
  r: k('rSource', 'code'),
  dart: k('dartSource', 'code'),
  vue: k('vueComponent', 'code'),
  svelte: k('svelteComponent', 'code'),

  // Markup & styles
  html: k('htmlDocument', 'markup'),
  htm: k('htmlDocument', 'markup'),
  css: k('stylesheet', 'markup'),
  scss: k('sassStylesheet', 'markup'),
  sass: k('sassStylesheet', 'markup'),
  less: k('lessStylesheet', 'markup'),

  // Data & config
  json: k('json', 'data'),
  json5: k('json', 'data'),
  yml: k('yaml', 'data'),
  yaml: k('yaml', 'data'),
  toml: k('toml', 'data'),
  xml: k('xml', 'data'),
  csv: k('csv', 'data'),
  tsv: k('tsv', 'data'),
  ini: k('iniConfig', 'data'),
  env: k('envFile', 'data'),
  conf: k('config', 'data'),

  // Archives
  zip: k('archive', 'archive'),
  tar: k('archive', 'archive'),
  gz: k('archive', 'archive'),
  tgz: k('archive', 'archive'),
  rar: k('archive', 'archive'),
  '7z': k('archive', 'archive'),
  bz2: k('archive', 'archive'),
  xz: k('archive', 'archive'),
  zst: k('archive', 'archive'),

  // Binaries & disk images
  exe: k('executable', 'binary'),
  appimage: k('executable', 'binary'),
  deb: k('debianPackage', 'binary'),
  rpm: k('rpmPackage', 'binary'),
  dmg: k('diskImage', 'binary'),
  iso: k('diskImage', 'binary'),
  log: k('logFile', 'text'),

  // 3D models
  stl: k('stlModel', 'model'),
  obj: k('objModel', 'model'),
  ply: k('plyModel', 'model'),
  glb: k('gltfModel', 'model'),

  // Fonts
  ttf: k('font', 'font'),
  otf: k('font', 'font'),
  woff: k('font', 'font'),
  woff2: k('font', 'font'),
}

/** Key into the `kinds` translation namespace, e.g. `jpegImage`. */
export type KindKey =
  | (typeof KINDS)[keyof typeof KINDS]['key']
  | 'file'
  | 'folder'

export interface FileKind {
  key: KindKey
  category: Category
  color: string
  /** Set only for unrecognised extensions, which fall back to "{EXT} file". */
  ext?: string
}

export const EXTENSION_KINDS: Record<string, FileKind> = KINDS

export const FOLDER_KIND: FileKind = {
  key: 'folder',
  category: 'folder',
  color: '#6ea8fe',
}

export function fileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function fileBadge(name: string): string {
  return fileExt(name).toUpperCase() || 'FILE'
}

/** Delimiter-separated data files that can be previewed as a table. */
export function tabularDelimiter(name: string): string | null {
  const ext = fileExt(name)
  if (ext === 'csv') return ','
  if (ext === 'tsv') return '\t'
  return null
}

export function fileKind(name: string): FileKind {
  const ext = fileExt(name)
  return (
    EXTENSION_KINDS[ext] ?? {
      key: 'file',
      category: 'file',
      color: KIND_COLORS.text,
      ext: ext ? ext.toUpperCase() : undefined,
    }
  )
}
