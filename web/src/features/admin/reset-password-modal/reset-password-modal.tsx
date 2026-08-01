import { useI18nContext } from '@i18n'

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
  const { LL } = useI18nContext()

  const form = useForm({
    initialValues: { password: '' },
    validate: {
      password: (v) => (v.length >= 8 ? null : LL.auth.minPassword()),
    },
  })

  return (
    <Modal
      opened={!!user}
      onClose={() => {
        form.reset()
        onClose()
      }}
      title={LL.admin.resetPasswordTitle({ username: user?.username ?? '' })}
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
            {LL.admin.resetPasswordBody()}
          </Text>
          <PasswordInput
            label={LL.admin.newPassword()}
            placeholder={LL.auth.minPassword()}
            {...form.getInputProps('password')}
          />
          <Group justify="flex-end">
            <Button type="submit">{LL.admin.resetPassword()}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
