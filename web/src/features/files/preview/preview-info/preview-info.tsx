import {
  ActionIcon,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'

import {
  ArrowSquareOutIcon,
  ShareNetworkIcon,
  XIcon,
} from '@phosphor-icons/react'

import { DetailMeta } from '../../detail-panel/detail-meta'
import type { MetaRow } from '../../detail-panel/helpers'
import classes from './preview-info.module.css'

export type PreviewInfoProps = {
  rows: MetaRow[]
  viewUrl: string
  copied: boolean
  onShare: () => void
  onClose: () => void
}

export function PreviewInfo({
  rows,
  viewUrl,
  copied,
  onShare,
  onClose,
}: PreviewInfoProps) {
  return (
    <Stack className={classes.info} gap={0}>
      <Group
        className={classes.infoHeader}
        justify="space-between"
        wrap="nowrap"
      >
        <Text size="xs" c="dark.3" className={classes.infoTitle}>
          Info
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClose}
          aria-label="Hide info"
        >
          <XIcon size={16} />
        </ActionIcon>
      </Group>

      <ScrollArea className={classes.infoBody} scrollbarSize={8}>
        <Stack gap="lg" p="md" pt={0}>
          <DetailMeta rows={rows} />
        </Stack>
      </ScrollArea>

      <Group className={classes.infoFooter} gap="sm" grow>
        <Button
          variant="default"
          leftSection={<ShareNetworkIcon size={16} />}
          onClick={onShare}
        >
          {copied ? 'Copied' : 'Share'}
        </Button>
        <Button
          component="a"
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          variant="default"
          leftSection={<ArrowSquareOutIcon size={16} />}
        >
          Open
        </Button>
      </Group>
    </Stack>
  )
}
