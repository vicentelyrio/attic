import { useEffect, useMemo, useState } from 'react'

import { dayjs, fileBadge, fileKind, relativeTime, size } from '@infrastructure'

import {
  ActionIcon,
  AspectRatio,
  Badge,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { useClipboard } from '@mantine/hooks'

import {
  DownloadSimpleIcon,
  ShareNetworkIcon,
  XIcon,
} from '@phosphor-icons/react'

import { downloadUrl, type Entry } from '@domain'

import { FilePlaceholder, previewStrategies } from '../card'
import { EntryIcon } from '../entry-icon'
import classes from './detail-panel.module.css'

export type DetailPanelProps = {
  entry: Entry
  root: string
  path: string
  onClose: () => void
}

function Preview({ entry, root, path }: Omit<DetailPanelProps, 'onClose'>) {
  const strategy = previewStrategies.find((s) => s.match(entry))
  const content = strategy ? (
    strategy.render({ entry, root, path })
  ) : (
    <FilePlaceholder entry={entry} />
  )

  return (
    <Box className={classes.preview}>
      <AspectRatio ratio={16 / 10}>{content}</AspectRatio>
      <Badge className={classes.previewBadge} variant="default" radius="sm">
        {fileBadge(entry.name)} · {size(entry.size)}
      </Badge>
    </Box>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group className={classes.row} justify="space-between" wrap="nowrap">
      <Text size="sm" c="dark.3">
        {label}
      </Text>
      <Text size="sm" c="dark.1" className={classes.value}>
        {value}
      </Text>
    </Group>
  )
}

function useImageDimensions(entry: Entry, root: string, path: string) {
  const [dims, setDims] = useState<string | null>(null)

  useEffect(() => {
    setDims(null)
    if (fileKind(entry.name).category !== 'image') return

    const filePath = path ? `${path}/${entry.name}` : entry.name
    const img = new Image()
    img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight}`)
    img.src = downloadUrl(root, filePath)
    return () => {
      img.onload = null
    }
  }, [entry.name, root, path])

  return dims
}

export function DetailPanel({ entry, root, path, onClose }: DetailPanelProps) {
  const clipboard = useClipboard({ timeout: 1500 })
  const dims = useImageDimensions(entry, root, path)

  const filePath = path ? `${path}/${entry.name}` : entry.name
  const viewUrl = downloadUrl(root, filePath)
  const kind = fileKind(entry.name)

  const rows = useMemo(() => {
    const where = [root, ...(path ? path.split('/') : [])].join(' / ')
    return [
      { label: 'Kind', value: kind.label },
      { label: 'Size', value: `${entry.size.toLocaleString()} bytes` },
      dims && { label: 'Dimensions', value: dims },
      { label: 'Created', value: dayjs.unix(entry.created).format('ll') },
      { label: 'Modified', value: relativeTime(entry.modified) },
      { label: 'Where', value: where },
    ].filter(Boolean) as { label: string; value: string }[]
  }, [entry, root, path, dims, kind.label])

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
          <Preview entry={entry} root={root} path={path} />
          <Stack gap={0}>
            {rows.map((row) => (
              <Row key={row.label} {...row} />
            ))}
          </Stack>
        </Stack>
      </ScrollArea>

      <Stack className={classes.footer} gap="sm">
        <Group gap="sm" grow>
          <Button component="a" href={viewUrl} target="_blank" rel="noreferrer">
            Open
          </Button>
          <Button
            variant="default"
            leftSection={<ShareNetworkIcon size={16} />}
            onClick={() => clipboard.copy(`${location.origin}${viewUrl}`)}
          >
            {clipboard.copied ? 'Copied' : 'Share'}
          </Button>
        </Group>
        <Button
          component="a"
          href={downloadUrl(root, filePath, true)}
          variant="default"
          leftSection={<DownloadSimpleIcon size={16} />}
        >
          Download
        </Button>
      </Stack>
    </Stack>
  )
}
