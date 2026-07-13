import type { ReactNode } from 'react'

import { Group, Kbd, Text } from '@mantine/core'

import classes from '../search.module.css'

export function SearchHint({
  keys,
  label,
}: {
  keys: ReactNode[]
  label: string
}) {
  return (
    <Group gap="xs" wrap="nowrap">
      <span className={classes.hintKeys}>
        {keys.map((k, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static, order-stable
          <Kbd key={i}>{k}</Kbd>
        ))}
      </span>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  )
}
