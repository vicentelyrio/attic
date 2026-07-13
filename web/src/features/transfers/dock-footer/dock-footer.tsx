import { size } from '@infrastructure'

import { Button, Group, Text } from '@mantine/core'

import type { TransfersState } from '../helpers'

export function DockFooter({ state }: { state: TransfersState }) {
  const { bytesTotal, hasFinished, busy, clear, clearPending, cancelAll } =
    state

  return (
    <Group justify="space-between" wrap="nowrap" px="sm" py="xs">
      <Text size="xs" c="dimmed">
        Total{' '}
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
            Clear
          </Button>
        )}
        {busy && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            onClick={cancelAll}
          >
            Cancel all
          </Button>
        )}
      </Group>
    </Group>
  )
}
