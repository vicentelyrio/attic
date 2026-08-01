import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import { Button, Group, Text } from '@mantine/core'

import type { TransfersState } from '../helpers'

export function DockFooter({ state }: { state: TransfersState }) {
  const { LL } = useI18nContext()
  const { bytesTotal, hasFinished, busy, clear, clearPending, cancelAll } =
    state

  return (
    <Group justify="space-between" wrap="nowrap" px="sm" py="xs">
      <Text size="xs" c="dimmed">
        {LL.common.total()}{' '}
        <Text span ff="monospace" c="dark.2">
          {size(bytesTotal)}
        </Text>
      </Text>
      <Group gap="xs" wrap="nowrap">
        {hasFinished && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            onClick={clear}
            disabled={clearPending}
          >
            {LL.common.clear()}
          </Button>
        )}
        {busy && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            onClick={cancelAll}
          >
            {LL.common.cancelAll()}
          </Button>
        )}
      </Group>
    </Group>
  )
}
