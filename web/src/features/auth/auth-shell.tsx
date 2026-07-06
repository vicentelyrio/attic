import type { ReactNode } from 'react'

import { Box, Divider, Stack, Text, Title } from '@mantine/core'

import classes from './auth.module.css'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <Box className={classes.screen}>
      <Stack className={classes.panel} gap="lg">
        <Stack gap="xs" align="center">
          <Title order={1} ta="center" mb="md">Attic</Title>
          <Divider className={classes.divider} color="dark.5" />
          <Title order={2} ta="center">{title}</Title>
          <Text size="sm" c="dimmed" ta="center">{subtitle}</Text>
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}
