import { ScrollArea, Stack } from '@mantine/core'

import type { TransfersState } from '../helpers'
import { TransferRow } from '../transfer-row'

export function TransferList({ state }: { state: TransfersState }) {
  const { visible, cancel, openResolve } = state

  return (
    <ScrollArea.Autosize mah={340}>
      <Stack gap={0} px="sm" py={4}>
        {visible.map((job) => (
          <TransferRow
            key={job.id}
            job={job}
            onCancel={() => cancel(job.id)}
            onResolve={() => openResolve(job.id)}
          />
        ))}
      </Stack>
    </ScrollArea.Autosize>
  )
}
