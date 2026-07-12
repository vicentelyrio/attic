import { Stack, Table, Text } from '@mantine/core'

import type { User } from '@domain'

import { AccountRow } from '../account-row'
import type { AccountsState } from '../hooks'

export function AccountsTable({
  title,
  rows,
  state,
}: {
  title: string
  rows: User[]
  state: AccountsState
}) {
  return (
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
            rows.map((user) => (
              <AccountRow key={user.id} user={user} state={state} />
            ))
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
}
