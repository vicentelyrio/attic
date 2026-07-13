import { ActionIcon, Group, ScrollArea, Stack, Text } from '@mantine/core'

import { XIcon } from '@phosphor-icons/react'

import type { Entry } from '@domain'

import { EntryIcon } from '../entry-icon'
import { DetailActions } from './detail-actions'
import { DetailMeta } from './detail-meta'
import classes from './detail-panel.module.css'
import { DetailPreview } from './detail-preview'
import { useDetailPanel } from './hooks'

export type DetailPanelProps = {
  entry: Entry
  root: string
  path: string
  onClose: () => void
}

export function DetailPanel({ entry, root, path, onClose }: DetailPanelProps) {
  const { rows, viewUrl, downloadHref, copied, share } = useDetailPanel(
    entry,
    root,
    path,
  )

  return (
    <Stack className={classes.panel} gap={0}>
      <Group className={classes.header} gap="sm" wrap="nowrap">
        <EntryIcon name={entry.name} isDir={false} />
        <Text fw={600} c="dark.0" truncate flex={1} miw={0}>
          {entry.name}
        </Text>
        <ActionIcon variant="subtle" color="gray" onClick={onClose}>
          <XIcon size={18} />
        </ActionIcon>
      </Group>

      <ScrollArea className={classes.body} scrollbarSize={8}>
        <Stack gap="lg" p="md">
          <DetailPreview entry={entry} root={root} path={path} />
          <DetailMeta rows={rows} />
        </Stack>
      </ScrollArea>

      <DetailActions
        viewUrl={viewUrl}
        downloadHref={downloadHref}
        copied={copied}
        onShare={share}
      />
    </Stack>
  )
}
