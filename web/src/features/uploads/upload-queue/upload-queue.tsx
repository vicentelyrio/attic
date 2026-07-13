import { size } from '@infrastructure'

import { Group, ScrollArea, Stack, Text } from '@mantine/core'

import type { Upload } from '@domain'

import { UploadRow } from '../upload-row'
import classes from './upload-queue.module.css'

type UploadQueueProps = {
  items: Upload[]
  doneCount: number
  speed: number
  onCancel: (id: string) => void
}

export function UploadQueue({
  items,
  doneCount,
  speed,
  onCancel,
}: UploadQueueProps) {
  return (
    <>
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" c="dimmed" fw={600} className={classes.queueLabel}>
          QUEUE · {doneCount} of {items.length} done
        </Text>
        {speed > 0 && (
          <Text size="xs" c="dimmed" ff="monospace">
            {size(speed)}/s
          </Text>
        )}
      </Group>

      <ScrollArea.Autosize mah={320}>
        <Stack gap={0}>
          {items.map((item) => (
            <UploadRow
              key={item.id}
              item={item}
              onCancel={() => onCancel(item.id)}
            />
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </>
  )
}
