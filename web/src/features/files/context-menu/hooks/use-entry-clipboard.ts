import { type ClipboardRef, type Entry, useClipboardActions } from '@domain'

import { entryRelPath } from '../helpers'

export function useEntryClipboard(root: string, path: string) {
  const { hasClipboard, copy, cut, paste } = useClipboardActions(root, path)

  const toRefs = (list: Entry[]): ClipboardRef[] =>
    list.map((e) => ({ root, path: entryRelPath(path, e) }))

  return {
    hasClipboard,
    paste,
    copy: (list: Entry[]) => copy(toRefs(list)),
    cut: (list: Entry[]) => cut(toRefs(list)),
  }
}
