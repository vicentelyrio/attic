export interface FileKind {
  label: string
  category: string
  color: string
}

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

type Category = keyof typeof KIND_COLORS

const k = (label: string, category: Category): FileKind => ({
  label,
  category,
  color: KIND_COLORS[category],
})

export const EXTENSION_KINDS: Record<string, FileKind> = {
  // Images
  jpg: k('JPEG image', 'image'),
  jpeg: k('JPEG image', 'image'),
  png: k('PNG image', 'image'),
  gif: k('GIF image', 'image'),
  webp: k('WebP image', 'image'),
  svg: k('SVG image', 'image'),
  bmp: k('Bitmap image', 'image'),
  tiff: k('TIFF image', 'image'),
  tif: k('TIFF image', 'image'),
  ico: k('Icon', 'image'),
  heic: k('HEIC image', 'image'),
  avif: k('AVIF image', 'image'),
  raw: k('RAW image', 'image'),

  // Video
  mp4: k('MPEG-4 movie', 'video'),
  m4v: k('MPEG-4 movie', 'video'),
  mov: k('QuickTime movie', 'video'),
  mkv: k('Matroska video', 'video'),
  avi: k('AVI video', 'video'),
  webm: k('WebM video', 'video'),
  flv: k('Flash video', 'video'),
  wmv: k('Windows Media video', 'video'),
  mpg: k('MPEG video', 'video'),
  mpeg: k('MPEG video', 'video'),
  '3gp': k('3GP video', 'video'),

  // Audio
  mp3: k('MP3 audio', 'audio'),
  wav: k('WAV audio', 'audio'),
  flac: k('FLAC audio', 'audio'),
  aac: k('AAC audio', 'audio'),
  ogg: k('Ogg audio', 'audio'),
  m4a: k('MPEG-4 audio', 'audio'),
  wma: k('Windows Media audio', 'audio'),
  opus: k('Opus audio', 'audio'),
  aiff: k('AIFF audio', 'audio'),

  // Documents
  pdf: k('PDF document', 'pdf'),
  doc: k('Word document', 'doc'),
  docx: k('Word document', 'doc'),
  odt: k('OpenDocument text', 'doc'),
  rtf: k('Rich text', 'text'),
  txt: k('Plain text', 'text'),
  xls: k('Excel spreadsheet', 'sheet'),
  xlsx: k('Excel spreadsheet', 'sheet'),
  ods: k('OpenDocument sheet', 'sheet'),
  ppt: k('PowerPoint presentation', 'slide'),
  pptx: k('PowerPoint presentation', 'slide'),
  odp: k('OpenDocument slides', 'slide'),
  epub: k('EPUB book', 'doc'),

  // Markdown
  md: k('Markdown', 'markdown'),
  markdown: k('Markdown', 'markdown'),
  mdx: k('MDX', 'markdown'),

  // Code
  js: k('JavaScript', 'code'),
  mjs: k('JavaScript', 'code'),
  cjs: k('JavaScript', 'code'),
  jsx: k('JavaScript React', 'code'),
  ts: k('TypeScript', 'code'),
  tsx: k('TypeScript React', 'code'),
  go: k('Go source', 'code'),
  rs: k('Rust source', 'code'),
  py: k('Python source', 'code'),
  rb: k('Ruby source', 'code'),
  java: k('Java source', 'code'),
  kt: k('Kotlin source', 'code'),
  c: k('C source', 'code'),
  h: k('C header', 'code'),
  cpp: k('C++ source', 'code'),
  cc: k('C++ source', 'code'),
  cxx: k('C++ source', 'code'),
  hpp: k('C++ header', 'code'),
  cs: k('C# source', 'code'),
  php: k('PHP source', 'code'),
  swift: k('Swift source', 'code'),
  sh: k('Shell script', 'code'),
  bash: k('Shell script', 'code'),
  sql: k('SQL', 'code'),
  lua: k('Lua source', 'code'),
  r: k('R source', 'code'),
  dart: k('Dart source', 'code'),
  vue: k('Vue component', 'code'),
  svelte: k('Svelte component', 'code'),

  // Markup & styles
  html: k('HTML document', 'markup'),
  htm: k('HTML document', 'markup'),
  css: k('Stylesheet', 'markup'),
  scss: k('Sass stylesheet', 'markup'),
  sass: k('Sass stylesheet', 'markup'),
  less: k('Less stylesheet', 'markup'),

  // Data & config
  json: k('JSON', 'data'),
  json5: k('JSON', 'data'),
  yml: k('YAML', 'data'),
  yaml: k('YAML', 'data'),
  toml: k('TOML', 'data'),
  xml: k('XML', 'data'),
  csv: k('CSV', 'data'),
  tsv: k('TSV', 'data'),
  ini: k('INI config', 'data'),
  env: k('Env file', 'data'),
  conf: k('Config', 'data'),

  // Archives
  zip: k('Archive', 'archive'),
  tar: k('Archive', 'archive'),
  gz: k('Archive', 'archive'),
  tgz: k('Archive', 'archive'),
  rar: k('Archive', 'archive'),
  '7z': k('Archive', 'archive'),
  bz2: k('Archive', 'archive'),
  xz: k('Archive', 'archive'),
  zst: k('Archive', 'archive'),

  // Binaries & disk images
  exe: k('Executable', 'binary'),
  appimage: k('Executable', 'binary'),
  deb: k('Debian package', 'binary'),
  rpm: k('RPM package', 'binary'),
  dmg: k('Disk image', 'binary'),
  iso: k('Disk image', 'binary'),
  log: k('Log file', 'text'),

  // 3D models
  stl: k('STL model', 'model'),
  obj: k('OBJ model', 'model'),
  ply: k('PLY model', 'model'),
  glb: k('glTF model', 'model'),

  // Fonts
  ttf: k('Font', 'font'),
  otf: k('Font', 'font'),
  woff: k('Font', 'font'),
  woff2: k('Font', 'font'),
}

export const FOLDER_KIND: FileKind = {
  label: 'Folder',
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
      label: ext ? `${ext.toUpperCase()} file` : 'File',
      category: 'file',
      color: KIND_COLORS.text,
    }
  )
}
