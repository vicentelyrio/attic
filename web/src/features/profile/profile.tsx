import { useI18nContext, useLocale } from '@i18n'
import { useNavigate } from '@tanstack/react-router'

import { Avatar, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core'

import {
  CheckIcon,
  SignOutIcon,
  TranslateIcon,
  UsersIcon,
} from '@phosphor-icons/react'

import { isAdmin, useLogout, useMe } from '@domain'

export function Profile() {
  const { LL } = useI18nContext()
  const { locale, locales, setLocale } = useLocale()
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
                {LL.admin.roles[me.role]()}
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
            {LL.sidebar.accounts()}
          </Menu.Item>
        )}

        <Menu.Sub position="right-end">
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<TranslateIcon size={16} />}>
              {LL.sidebar.language()}
            </Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            {locales.map((option) => (
              <Menu.Item
                key={option}
                onClick={() => setLocale(option)}
                rightSection={
                  option === locale ? <CheckIcon size={14} /> : undefined
                }
              >
                {LL.locales[option]()}
              </Menu.Item>
            ))}
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        <Menu.Item
          color="red"
          leftSection={<SignOutIcon size={16} />}
          onClick={signOut}
        >
          {LL.sidebar.signOut()}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
