import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import { Box, Stack, Text } from '@mantine/core'

import { type Root, useRoots } from '@domain'

import { NavLink, useDroppableFolder } from '@features'

import classes from './drivers.module.css'

function dotColor(usedPercent: number) {
  if (usedPercent > 90) return 'var(--mantine-color-red-5)'
  if (usedPercent > 70) return 'var(--mantine-color-orange-5)'
  return 'var(--mantine-color-green-5)'
}

function DriveItem({ root }: { root: Root }) {
  const usedPercent = root.total > 0 ? (root.used / root.total) * 100 : 0
  const drop = useDroppableFolder({ root: root.name, dir: '' })

  return (
    <div
      ref={drop.setNodeRef}
      className={classes.dropTarget}
      data-drop-active={drop.dropActive || undefined}
      data-drop-invalid={drop.dropInvalid || undefined}
    >
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
    </div>
  )
}

export function Drivers() {
  const { LL } = useI18nContext()
  const { data: roots = [] } = useRoots()

  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} c="dimmed">
        {LL.sidebar.drives()}
      </Text>
      {roots.map((root) => (
        <DriveItem key={root.name} root={root} />
      ))}
    </Stack>
  )
}
