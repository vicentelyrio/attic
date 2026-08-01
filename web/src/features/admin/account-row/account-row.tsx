import { useI18nContext } from '@i18n'

import { Badge, Button, Group, Table, Text } from '@mantine/core'

import type { User } from '@domain'

import { roleColor, statusColor } from '../helpers'
import type { AccountsState } from '../hooks'

export function AccountRow({
  user,
  state,
}: {
  user: User
  state: AccountsState
}) {
  const { LL } = useI18nContext()
  const { me, approve, disable, openReset, openRemove } = state
  const isSelf = user.id === me?.id

  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{user.username}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={roleColor[user.role]} variant="light" size="sm">
          {LL.admin.roles[user.role]()}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={statusColor[user.status]} variant="light" size="sm">
          {LL.admin.statuses[user.status]()}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          {user.status !== 'active' && (
            <Button
              size="compact-sm"
              variant="light"
              color="green"
              loading={approve.isPending && approve.variables === user.id}
              onClick={() => approve.mutate(user.id)}
            >
              {user.status === 'pending'
                ? LL.admin.approve()
                : LL.admin.enable()}
            </Button>
          )}
          {user.status === 'active' && !isSelf && (
            <Button
              size="compact-sm"
              variant="default"
              loading={disable.isPending && disable.variables === user.id}
              onClick={() => disable.mutate(user.id)}
            >
              {LL.admin.disable()}
            </Button>
          )}
          <Button
            size="compact-sm"
            variant="default"
            onClick={() => openReset(user)}
          >
            {LL.admin.resetPassword()}
          </Button>
          {!isSelf && (
            <Button
              size="compact-sm"
              variant="subtle"
              color="red"
              onClick={() => openRemove(user)}
            >
              {LL.common.remove()}
            </Button>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}
