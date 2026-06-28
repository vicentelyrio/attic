import { Box, NavLink, Stack, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'

import { useRoots, type Root } from '@domain'
import { size } from '@infrastructure'

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
      component={Link}
      className={classes.navItem}
      activeProps={{ className: classes.navItemActive }}
      to="/$root/$"
      params={{ root: root.name, _splat: '' }}
      label={root.name}
      color="gray"
      leftSection={
        <Box className={classes.dot} style={{ backgroundColor: dotColor(usedPercent) }} />
      }
      rightSection={
        <Text size="xs" c="dimmed">{size(root.total)}</Text>
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
