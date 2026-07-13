import { Button, Group, Modal, Stack, Text } from '@mantine/core'

import type { User } from '@domain'

export type RemoveAccountModalProps = {
  user: User | null
  pending: boolean
  onConfirm: () => void
  onClose: () => void
}

export function RemoveAccountModal({
  user,
  pending,
  onConfirm,
  onClose,
}: RemoveAccountModalProps) {
  return (
    <Modal opened={!!user} onClose={onClose} title="Remove account" centered>
      <Stack>
        <Text size="sm">
          Remove <b>{user?.username}</b>? This deletes their account and signs
          them out everywhere. This cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" loading={pending} onClick={onConfirm}>
            Remove
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
