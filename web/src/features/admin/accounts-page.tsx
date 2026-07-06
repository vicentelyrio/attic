import { useState } from 'react'

import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'

import {
  type AccountStatus,
  HttpError,
  type Role,
  type User,
  useAdminUsers,
  useMe,
} from '@domain'

const statusColor: Record<AccountStatus, string> = {
  pending: 'orange',
  active: 'green',
  disabled: 'dark',
}

const roleColor: Record<Role, string> = {
  owner: 'indigo',
  admin: 'violet',
  user: 'gray',
}

export function AccountsPage() {
  const { users, approve, disable, remove, resetPassword } = useAdminUsers()
  const { data: me } = useMe()

  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [removeTarget, setRemoveTarget] = useState<User | null>(null)

  const list = users.data ?? []
  const pending = list.filter((u) => u.status === 'pending')
  const members = list.filter((u) => u.status !== 'pending')

  const actionError = [approve.error, disable.error, remove.error].find(Boolean)
  const errorText =
    actionError instanceof HttpError ? actionError.message : null

  const renderRow = (u: User) => {
    const isSelf = u.id === me?.id
    return (
      <Table.Tr key={u.id}>
        <Table.Td>
          <Text fw={500}>{u.username}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={roleColor[u.role]} variant="light" size="sm">
            {u.role}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Badge color={statusColor[u.status]} variant="light" size="sm">
            {u.status}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            {u.status !== 'active' && (
              <Button
                size="compact-sm"
                variant="light"
                color="green"
                loading={approve.isPending && approve.variables === u.id}
                onClick={() => approve.mutate(u.id)}
              >
                {u.status === 'pending' ? 'Approve' : 'Enable'}
              </Button>
            )}
            {u.status === 'active' && !isSelf && (
              <Button
                size="compact-sm"
                variant="default"
                loading={disable.isPending && disable.variables === u.id}
                onClick={() => disable.mutate(u.id)}
              >
                Disable
              </Button>
            )}
            <Button
              size="compact-sm"
              variant="default"
              onClick={() => setResetTarget(u)}
            >
              Reset password
            </Button>
            {!isSelf && (
              <Button
                size="compact-sm"
                variant="subtle"
                color="red"
                onClick={() => setRemoveTarget(u)}
              >
                Remove
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  }

  const section = (title: string, rows: User[]) => (
    <Stack gap="sm">
      <Text fw={600} size="sm" c="dimmed">
        {title} ({rows.length})
      </Text>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Username</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows.map(renderRow)
          ) : (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No accounts
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  )

  return (
    <Box style={{ overflow: 'auto', flex: 1 }} p="xl">
      <Stack gap="xl" maw={860}>
        <Stack gap={4}>
          <Title order={3}>Accounts</Title>
          <Text size="sm" c="dimmed">
            Approve new sign-ups and manage existing accounts.
          </Text>
        </Stack>

        {errorText && (
          <Alert color="red" variant="light" py="xs">
            {errorText}
          </Alert>
        )}

        {pending.length > 0 && section('Pending approval', pending)}
        {section('Members', members)}
      </Stack>

      <ResetPasswordModal
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onSubmit={async (password) => {
          if (resetTarget) {
            await resetPassword.mutateAsync({ id: resetTarget.id, password })
            setResetTarget(null)
          }
        }}
      />

      <Modal
        opened={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove account"
        centered
      >
        <Stack>
          <Text size="sm">
            Remove <b>{removeTarget?.username}</b>? This deletes their account and
            signs them out everywhere. This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={remove.isPending}
              onClick={async () => {
                if (removeTarget) {
                  await remove.mutateAsync(removeTarget.id).catch(() => {})
                  setRemoveTarget(null)
                }
              }}
            >
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}

interface ResetModalProps {
  user: User | null
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
}

function ResetPasswordModal({ user, onClose, onSubmit }: ResetModalProps) {
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
