import { useI18nContext } from '@i18n'

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

import classes from './preview-info.module.css'
import { DetailMeta } from '@/features/files/detail-panel/detail-meta'
import type { MetaRow } from '@/features/files/detail-panel/helpers'

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
  const { LL } = useI18nContext()

  return (
    <Stack className={classes.info} gap={0}>
      <Group
        className={classes.infoHeader}
        justify="space-between"
        wrap="nowrap"
      >
        <Text size="xs" c="dark.3" className={classes.infoTitle}>
          {LL.detail.info()}
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClose}
          aria-label={LL.detail.hideInfo()}
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
          {copied ? LL.common.copied() : LL.common.share()}
        </Button>
        <Button
          component="a"
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          variant="default"
          leftSection={<ArrowSquareOutIcon size={16} />}
        >
          {LL.common.open()}
        </Button>
      </Group>
    </Stack>
  )
}
