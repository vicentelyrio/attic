import { useI18nContext } from '@i18n'

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
  const { LL } = useI18nContext()

  return (
    <Modal
      opened={!!user}
      onClose={onClose}
      title={LL.admin.removeTitle()}
      centered
    >
      <Stack>
        <Text size="sm">
          {LL.admin.removeQuestion({ username: user?.username ?? '' })}{' '}
          {LL.admin.removeBody()}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {LL.common.cancel()}
          </Button>
          <Button color="red" loading={pending} onClick={onConfirm}>
            {LL.common.remove()}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
