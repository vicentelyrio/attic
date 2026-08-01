import { type FormEvent, useEffect, useState } from 'react'

import { useI18nContext } from '@i18n'

import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'

export type NewEntryKind = 'folder' | 'file'

export type NewEntryDialogProps = {
  kind: NewEntryKind | null
  pending?: boolean
  onSubmit: (name: string) => void
  onClose: () => void
}

export function NewEntryDialog({
  kind,
  pending,
  onSubmit,
  onClose,
}: NewEntryDialogProps) {
  const { LL } = useI18nContext()
  const [name, setName] = useState('')

  useEffect(() => {
    if (kind)
      setName(
        kind === 'folder' ? LL.menu.untitledFolder() : LL.menu.untitledFile(),
      )
  }, [kind, LL])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <Modal
      opened={!!kind}
      onClose={onClose}
      title={kind === 'folder' ? LL.menu.newFolder() : LL.menu.newFile()}
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
            aria-label={LL.common.name()}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              {LL.common.cancel()}
            </Button>
            <Button type="submit" loading={pending} disabled={!name.trim()}>
              {LL.common.create()}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
