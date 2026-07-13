import { useState } from 'react'

import { notifications } from '@mantine/notifications'

import { type Entry, HttpError, useFileOps } from '@domain'

function renameError(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 409) return 'An item with that name already exists.'
    if (error.status === 400) return 'That name isn’t allowed.'
    if (error.status === 403) return 'You don’t have permission to rename this.'
  }
  return 'Could not rename the item.'
}

export function useRename(root: string, path: string) {
  const { rename } = useFileOps(root, path)
  const [renaming, setRenaming] = useState<string | null>(null)

  const submit = (entry: Entry, next: string) => {
    const name = next.trim()
    if (!name || name === entry.name) {
      setRenaming(null)
      return
    }

    rename.mutate(
      { entry, name },
      {
        onSuccess: ({ name: finalName }) => {
          setRenaming(null)
          notifications.show({
            color: 'teal',
            message: `Renamed to “${finalName}”.`,
          })
        },
        onError: (error) => {
          setRenaming(null)
          notifications.show({
            color: 'red',
            title: 'Rename failed',
            message: renameError(error),
          })
        },
      },
    )
  }

  return {
    renaming,
    begin: (entry: Entry) => setRenaming(entry.name),
    cancel: () => setRenaming(null),
    submit,
    pending: rename.isPending,
  }
}

export type RenameState = ReturnType<typeof useRename>

export type RenameControls = Pick<
  RenameState,
  'renaming' | 'pending' | 'submit' | 'cancel'
>
