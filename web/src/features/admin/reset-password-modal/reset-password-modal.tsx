import { Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core'
import { useForm } from '@mantine/form'

import type { User } from '@domain'

export type ResetPasswordModalProps = {
  user: User | null
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
}

export function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const form = useForm({
    initialValues: { password: '' },
    validate: {
      password: (v) => (v.length >= 8 ? null : 'At least 8 characters'),
    },
  })

  return (
    <Modal
      opened={!!user}
      onClose={() => {
        form.reset()
        onClose()
      }}
      title={`Reset password — ${user?.username ?? ''}`}
      centered
    >
      <form
        onSubmit={form.onSubmit(async ({ password }) => {
          await onSubmit(password)
          form.reset()
        })}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Set a new password for this account. Their existing sessions will be
            revoked.
          </Text>
          <PasswordInput
            label="New password"
            placeholder="At least 8 characters"
            {...form.getInputProps('password')}
          />
          <Group justify="flex-end">
            <Button type="submit">Reset password</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
