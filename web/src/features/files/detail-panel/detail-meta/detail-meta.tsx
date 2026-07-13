import { Group, Stack, Text } from '@mantine/core'

import classes from '../detail-panel.module.css'
import type { MetaRow } from '../helpers'

function Row({ label, value }: MetaRow) {
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

export function DetailMeta({ rows }: { rows: MetaRow[] }) {
  return (
    <Stack gap={0}>
      {rows.map((row) => (
        <Row key={row.label} {...row} />
      ))}
    </Stack>
  )
}
