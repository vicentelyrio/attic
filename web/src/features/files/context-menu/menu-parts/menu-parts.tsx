import type { ReactNode } from 'react'

import { FOLDER_KIND, fileKind, size } from '@infrastructure'

import { Group, Stack, Text } from '@mantine/core'

import type { Entry } from '@domain'

import { EntryIcon } from '../../entry-icon'
import classes from '../context-menu.module.css'

export function Shortcut({ children }: { children: ReactNode }) {
  return <Text className={classes.shortcut}>{children}</Text>
}

export function ReadOnly() {
  return (
    <Text size="xs" c="dimmed">
      Read-only
    </Text>
  )
}

export function EntryHeader({ entry }: { entry: Entry }) {
  const kind = entry.is_dir ? FOLDER_KIND : fileKind(entry.name)
  const meta = entry.is_dir
    ? `Folder · ${entry.items} ${entry.items === 1 ? 'item' : 'items'}`
    : `${kind.label} · ${size(entry.size)}`

  return (
    <Group gap="sm" wrap="nowrap" p="xs" className={classes.header}>
      <EntryIcon name={entry.name} isDir={entry.is_dir} />
      <Stack gap={0} miw={0}>
        <Text size="sm" fw={600} c="dark.0" truncate>
          {entry.name}
        </Text>
        <Text size="xs" c="dark.3" truncate>
          {meta}
        </Text>
      </Stack>
    </Group>
  )
}

export function CountHeader({ count }: { count: number }) {
  return (
    <Group gap="sm" wrap="nowrap" p="xs" className={classes.header}>
      <Text size="sm" fw={600} c="dark.0">
        {count} items selected
      </Text>
    </Group>
  )
}
