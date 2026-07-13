import { useState } from 'react'

import { type Entry, useFileOps } from '@domain'

import type { NewEntryKind } from '../new-entry-dialog'

export function useEntryMutations(root: string, path: string) {
  const { mkdir, touch, duplicate, remove } = useFileOps(root, path)
  const [newEntry, setNewEntry] = useState<NewEntryKind | null>(null)
  const [confirmTrash, setConfirmTrash] = useState<Entry[] | null>(null)

  const createEntry = (name: string) => {
    const op = newEntry === 'folder' ? mkdir : touch
    op.mutate(name, { onSuccess: () => setNewEntry(null) })
  }

  return {
    duplicate: (list: Entry[]) => duplicate.mutate(list),
    newEntry,
    openNew: (kind: NewEntryKind) => setNewEntry(kind),
    closeNew: () => setNewEntry(null),
    createEntry,
    createPending: mkdir.isPending || touch.isPending,
    confirmTrash,
    openTrash: (list: Entry[]) => setConfirmTrash(list),
    closeTrash: () => setConfirmTrash(null),
    trash: () => {
      if (confirmTrash)
        remove.mutate(confirmTrash, { onSuccess: () => setConfirmTrash(null) })
    },
    trashPending: remove.isPending,
  }
}
