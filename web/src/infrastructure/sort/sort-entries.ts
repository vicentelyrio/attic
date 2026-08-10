import type { Entry } from '@domain'

import { FOLDER_KIND, fileKind } from '../files'
import type { SortField, SortState } from './sort'

function compare(a: Entry, b: Entry, field: SortField): number {
  switch (field) {
    case 'name':
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    case 'size':
      return a.size - b.size
    case 'kind': {
      const ka = a.is_dir ? FOLDER_KIND : fileKind(a.name)
      const kb = b.is_dir ? FOLDER_KIND : fileKind(b.name)
      return ka.key.localeCompare(kb.key)
    }
    case 'modified':
      return a.modified - b.modified
  }
}

/** Folders always sort before files; `sort` only orders within each group. */
export function sortEntries(entries: Entry[], sort: SortState): Entry[] {
  const sign = sort.direction === 'asc' ? 1 : -1

  return [...entries].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
    return sign * compare(a, b, sort.field)
  })
}
