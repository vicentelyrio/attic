import { useNavigate } from '@tanstack/react-router'

import {
  Avatar,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'

import { SignOutIcon, UsersIcon } from '@phosphor-icons/react'

import { isAdmin, useLogout, useMe } from '@domain'

export function Profile() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const logoutMut = useLogout()

  if (!me) return null

  const signOut = async () => {
    await logoutMut.mutateAsync().catch(() => {})
    navigate({ to: '/login' })
  }

  return (
    <Menu position="top-start" width="target" withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs" wrap="nowrap">
            <Avatar size="sm" radius="xl" color="green">
              {me.username.slice(0, 2).toUpperCase()}
            </Avatar>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {me.username}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {me.role}
              </Text>
            </Stack>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {isAdmin(me) && (
          <Menu.Item
            leftSection={<UsersIcon size={16} />}
            onClick={() => navigate({ to: '/admin' })}
          >
            Accounts
          </Menu.Item>
        )}
        <Menu.Item
          color="red"
          leftSection={<SignOutIcon size={16} />}
          onClick={signOut}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
