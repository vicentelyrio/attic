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
  const count = entries?.length ?? 0
  const label =
    count === 1 && entries ? `“${entries[0].name}”` : `${count} items`
  const them = count === 1 ? 'it' : 'them'

  return (
    <Modal
      opened={!!entries}
      onClose={onClose}
      title="Move to Trash"
      size="sm"
      centered
    >
      <Stack gap="lg">
        <Text size="sm">
          Move {label} to the Trash? You can restore {them} from the Trash.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" loading={pending} onClick={onConfirm}>
            Move to Trash
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
