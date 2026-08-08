import { Text } from '@mantine/core'

import classes from '../grid.module.css'

export function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      tt="uppercase"
      size="xs"
      fw={600}
      c="dark.3"
      className={classes.label}
    >
      {label}
    </Text>
  )
}
