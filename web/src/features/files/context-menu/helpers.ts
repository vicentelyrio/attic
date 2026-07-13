import type { Entry } from '@domain'

export type Target =
  | { kind: 'entries'; entries: Entry[] }
  | { kind: 'empty' }
  | null

export function entryRelPath(path: string, entry: Entry): string {
  return path ? `${path}/${entry.name}` : entry.name
}
