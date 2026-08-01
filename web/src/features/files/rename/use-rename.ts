import { useState } from 'react'

import { type TranslationFunctions, useI18nContext } from '@i18n'

import { notifications } from '@mantine/notifications'

import { type Entry, HttpError, useFileOps } from '@domain'

function renameError(LL: TranslationFunctions, error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 409) return LL.files.rename.conflict()
    if (error.status === 400) return LL.files.rename.invalid()
    if (error.status === 403) return LL.files.rename.forbidden()
  }
  return LL.files.rename.generic()
}

export function useRename(root: string, path: string) {
  const { LL } = useI18nContext()
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
            message: LL.files.rename.success({ name: finalName }),
          })
        },
        onError: (error) => {
          setRenaming(null)
          notifications.show({
            color: 'red',
            title: LL.files.rename.failedTitle(),
            message: renameError(LL, error),
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
