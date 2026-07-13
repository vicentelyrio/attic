import type { ReactNode } from 'react'

import { Box, SimpleGrid, Stack, Text } from '@mantine/core'

import classes from '../grid.module.css'

export function GridSection({
  label,
  children,
  autoFill,
}: {
  label: string
  children: ReactNode
  autoFill?: boolean
}) {
  return (
    <Stack gap="sm">
      <Text
        tt="uppercase"
        size="xs"
        fw={600}
        c="dark.3"
        className={classes.label}
      >
        {label}
      </Text>
      {autoFill ? (
        <Box className={classes.grid}>{children}</Box>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 3, lg: 4 }} spacing="md">
          {children}
        </SimpleGrid>
      )}
    </Stack>
  )
}
