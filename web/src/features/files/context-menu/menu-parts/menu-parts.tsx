import { kindLabel, useI18nContext } from '@i18n'
import {
  FOLDER_KIND,
  fileKind,
  type ShortcutId,
  size,
  useShortcut,
} from '@infrastructure'

import { Group, Stack, Text } from '@mantine/core'

import type { Entry } from '@domain'

import { EntryIcon } from '../../entry-icon'
import classes from '../context-menu.module.css'

export function Shortcut({ id }: { id: ShortcutId }) {
  return <Text className={classes.shortcut}>{useShortcut(id)}</Text>
}

export function ReadOnly() {
  const { LL } = useI18nContext()

  return (
    <Text size="xs" c="dimmed">
      {LL.menu.readOnly()}
    </Text>
  )
}

export function EntryHeader({ entry }: { entry: Entry }) {
  const { LL } = useI18nContext()
  const kind = entry.is_dir ? FOLDER_KIND : fileKind(entry.name)
  const meta = entry.is_dir
    ? LL.menu.folderMeta({ count: entry.items })
    : LL.menu.fileMeta({ kind: kindLabel(LL, kind), size: size(entry.size) })

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
  const { LL } = useI18nContext()

  return (
    <Group gap="sm" wrap="nowrap" p="xs" className={classes.header}>
      <Text size="sm" fw={600} c="dark.0">
        {LL.menu.selectedCount({ count })}
      </Text>
    </Group>
  )
}
