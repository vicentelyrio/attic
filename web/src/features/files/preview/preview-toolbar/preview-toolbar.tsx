import { useI18nContext } from '@i18n'

import { ActionIcon, Button, Group, Text } from '@mantine/core'

import {
  DownloadSimpleIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react'

import type { Entry } from '@domain'

import classes from './preview-toolbar.module.css'
import { EntryIcon } from '@/features/files/entry-icon'

export type PreviewToolbarProps = {
  entry: Entry
  position: string
  location: string
  zoom: number
  zoomable: boolean
  downloadHref: string
  onZoomIn: () => void
  onZoomOut: () => void
  onClose: () => void
}

export function PreviewToolbar({
  entry,
  position,
  location,
  zoom,
  zoomable,
  downloadHref,
  onZoomIn,
  onZoomOut,
  onClose,
}: PreviewToolbarProps) {
  const { LL } = useI18nContext()

  return (
    <Group className={classes.toolbar} gap="sm" wrap="nowrap">
      <EntryIcon name={entry.name} isDir={false} />
      <Text fw={600} c="dark.0" truncate className={classes.name}>
        {entry.name}
      </Text>
      <Text size="sm" c="dark.3" className={classes.counter}>
        {position} · {location}
      </Text>

      <Group gap="sm" wrap="nowrap" ml="auto">
        {zoomable && (
          <Group className={classes.zoom} gap={2} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onZoomOut}
              aria-label={LL.preview.zoomOut()}
            >
              <MinusIcon size={16} />
            </ActionIcon>
            <Text size="sm" c="dark.1" className={classes.zoomValue}>
              {Math.round(zoom * 100)}%
            </Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onZoomIn}
              aria-label={LL.preview.zoomIn()}
            >
              <PlusIcon size={16} />
            </ActionIcon>
          </Group>
        )}

        <Button
          component="a"
          href={downloadHref}
          variant="default"
          leftSection={<DownloadSimpleIcon size={16} />}
        >
          {LL.common.download()}
        </Button>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={onClose}
          aria-label={LL.common.close()}
        >
          <XIcon size={18} />
        </ActionIcon>
      </Group>
    </Group>
  )
}
