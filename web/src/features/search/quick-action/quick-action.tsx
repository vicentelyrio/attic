import { Group, Text } from '@mantine/core'
import { Spotlight } from '@mantine/spotlight'

import type { ActionDef } from '../helpers'
import classes from './quick-action.module.css'

export function QuickAction({ icon, label, onClick }: ActionDef) {
  return (
    <Spotlight.Action onClick={onClick}>
      <Group gap="sm" wrap="nowrap" className={classes.row}>
        <span className={classes.actionIcon}>{icon}</span>
        <Text size="sm" fw={500}>
          {label}
        </Text>
      </Group>
    </Spotlight.Action>
  )
}
