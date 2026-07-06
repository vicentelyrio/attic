import type { ReactNode } from 'react'

import { Box, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core'

import { LockSimpleIcon } from '@phosphor-icons/react'

import classes from './auth.module.css'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

/** Centered, chrome-free layout for the auth pages (login / signup). Rendered
 *  outside the app shell so there's no sidebar or workspace. */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const theme = useMantineTheme()

  return (
    <Box className={classes.screen}>
      <Stack className={classes.panel} gap="lg">
        <Stack gap="xs" align="center">
          <div
            className={classes.icon}
            style={{ boxShadow: theme.other.accentGlowLg }}
          />
          <Title order={2} ta="center">
            {title}
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            {subtitle}
          </Text>
        </Stack>

        {children}

        <Group justify="center" gap="xs" mt="md">
          <LockSimpleIcon
            size={14}
            weight="fill"
            color="var(--mantine-color-green-6)"
          />
          <Text size="xs" c="dimmed" ff="monospace">
            vault.homelab.local
          </Text>
        </Group>
      </Stack>
    </Box>
  )
}
