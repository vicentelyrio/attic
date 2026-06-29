import { type Root, useRoots } from '@domain'
import { NavLink } from '@features'
import { size } from '@infrastructure'
import { Box, Stack, Text } from '@mantine/core'

import classes from './drivers.module.css'

function dotColor(usedPercent: number) {
  if (usedPercent > 90) return 'var(--mantine-color-red-5)'
  if (usedPercent > 70) return 'var(--mantine-color-orange-5)'
  return 'var(--mantine-color-green-5)'
}

function DriveItem({ root }: { root: Root }) {
  const usedPercent = root.total > 0 ? (root.used / root.total) * 100 : 0

  return (
    <NavLink
      className={classes.navItem}
      activeProps={{ className: classes.navItemActive }}
      to="/$root/$"
      params={{ root: root.name, _splat: '' }}
      label={root.name}
      color="gray"
      leftSection={
        <Box
          className={classes.dot}
          style={{ backgroundColor: dotColor(usedPercent) }}
        />
      }
      rightSection={
        <Text size="xs" c="dimmed">
          {size(root.total)}
        </Text>
      }
    />
  )
}

export function Drivers() {
  const { data: roots = [] } = useRoots()

  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} c="dimmed">
        Drives
      </Text>
      {roots.map((root) => (
        <DriveItem key={root.name} root={root} />
      ))}
    </Stack>
  )
}
