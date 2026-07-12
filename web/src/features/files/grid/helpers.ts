import type { Entry } from '@domain'

export function partitionEntries(data: Entry[] | undefined) {
  const folders: Entry[] = []
  const files: Entry[] = []
  for (const entry of data ?? []) {
    ;(entry.is_dir ? folders : files).push(entry)
  }
  return { folders, files }
}
