import { type FormEvent, useEffect, useState } from 'react'

import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'

export type NewEntryKind = 'folder' | 'file'

export type NewEntryDialogProps = {
  kind: NewEntryKind | null
  pending?: boolean
  onSubmit: (name: string) => void
  onClose: () => void
}

const DEFAULT_NAME: Record<NewEntryKind, string> = {
  folder: 'untitled folder',
  file: 'untitled file',
}

/** Prompt for the name of a new folder or file. Opens with a Finder-style
 *  default name pre-selected, so hitting Enter accepts it and typing replaces
 *  it. The backend de-duplicates the name, so a clash is never an error. */
export function NewEntryDialog({
  kind,
  pending,
  onSubmit,
  onClose,
}: NewEntryDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (kind) setName(DEFAULT_NAME[kind])
  }, [kind])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <Modal
      opened={!!kind}
      onClose={onClose}
      title={kind === 'folder' ? 'New Folder' : 'New File'}
      size="sm"
      centered
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            data-autofocus
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Name"
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!name.trim()}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
