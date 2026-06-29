import prettyBytes from 'pretty-bytes'

const size = prettyBytes

export interface SizeParts {
  value: string
  unit: string
}

/** Split a byte count into its numeric value and unit, e.g. "8.1" + "MB". */
export function sizeParts(bytes: number): SizeParts {
  const formatted = prettyBytes(bytes)
  const gap = formatted.lastIndexOf(' ')
  if (gap === -1) return { value: formatted, unit: '' }
  return { value: formatted.slice(0, gap), unit: formatted.slice(gap + 1) }
}

export { size }
