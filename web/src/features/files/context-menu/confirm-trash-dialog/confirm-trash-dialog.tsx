import { useI18nContext } from '@i18n'

import { Button, Group, Modal, Stack, Text } from '@mantine/core'

import type { Entry } from '@domain'

export type ConfirmTrashDialogProps = {
  entries: Entry[] | null
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmTrashDialog({
  entries,
  pending,
  onConfirm,
  onClose,
}: ConfirmTrashDialogProps) {
  const { LL } = useI18nContext()
  const count = entries?.length ?? 0

  return (
    <Modal
      opened={!!entries}
      onClose={onClose}
      title={LL.menu.moveToTrash()}
      size="sm"
      centered
    >
      <Stack gap="lg">
        <Text size="sm">
          {count === 1 && entries
            ? LL.menu.trashOne({ name: entries[0].name })
            : LL.menu.trashMany({ count })}
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {LL.common.cancel()}
          </Button>
          <Button color="red" loading={pending} onClick={onConfirm}>
            {LL.menu.moveToTrash()}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
