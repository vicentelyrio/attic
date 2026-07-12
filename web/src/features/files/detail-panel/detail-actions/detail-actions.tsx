import { Button, Group, Stack } from '@mantine/core'

import { DownloadSimpleIcon, ShareNetworkIcon } from '@phosphor-icons/react'

import classes from '../detail-panel.module.css'

export function DetailActions({
  viewUrl,
  downloadHref,
  copied,
  onShare,
}: {
  viewUrl: string
  downloadHref: string
  copied: boolean
  onShare: () => void
}) {
  return (
    <Stack className={classes.footer} gap="sm">
      <Group gap="sm" grow>
        <Button component="a" href={viewUrl} target="_blank" rel="noreferrer">
          Open
        </Button>
        <Button
          variant="default"
          leftSection={<ShareNetworkIcon size={16} />}
          onClick={onShare}
        >
          {copied ? 'Copied' : 'Share'}
        </Button>
      </Group>
      <Button
        component="a"
        href={downloadHref}
        variant="default"
        leftSection={<DownloadSimpleIcon size={16} />}
      >
        Download
      </Button>
    </Stack>
  )
}
