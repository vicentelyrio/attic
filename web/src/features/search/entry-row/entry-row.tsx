import { Group, Text } from '@mantine/core'

import { ArrowElbowDownLeftIcon } from '@phosphor-icons/react'

import type { RecentEntry } from '@domain'

import { EntryIcon } from '@features'

import { crumb } from '../helpers'
import classes from '../search.module.css'

export function EntryRow({ hit }: { hit: RecentEntry }) {
  return (
    <Group gap="sm" wrap="nowrap" className={classes.row}>
      <EntryIcon name={hit.name} isDir={hit.is_dir} size={30} />
      <div className={classes.meta}>
        <Text size="sm" fw={600} truncate>
          {hit.name}
        </Text>
        <Text size="xs" c="dimmed" ff="monospace" truncate>
          {crumb(hit)}
        </Text>
      </div>
      <span className={classes.openHint}>
        <ArrowElbowDownLeftIcon />
        open
      </span>
    </Group>
  )
}
