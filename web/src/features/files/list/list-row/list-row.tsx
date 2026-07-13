import {
  FOLDER_KIND,
  fileKind,
  relativeTime,
  type SelectMods,
} from '@infrastructure'

import { Table } from '@mantine/core'

import type { Entry } from '@domain'

import { CountBadge } from '../../count-badge'
import { EntryIcon } from '../../entry-icon'
import classes from '../list.module.css'
import { SizeCell } from '../size-cell'

export function ListRow({
  entry,
  selected,
  onOpen,
  onSelect,
}: {
  entry: Entry
  selected: boolean
  onOpen: (item: Entry) => void
  onSelect: (name: string, mods: SelectMods) => void
}) {
  return (
    <Table.Tr
      data-name={entry.name}
      className={[
        selected ? classes.selected : classes.row,
        entry.name.startsWith('.') && classes.dimmed,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(entry.name, {
          shift: e.shiftKey,
          toggle: e.metaKey || e.ctrlKey,
        })
      }}
      onDoubleClick={() => onOpen(entry)}
    >
      <Table.Td>
        <span className={classes.name}>
          <EntryIcon name={entry.name} isDir={entry.is_dir} />
          <span className={classes.label}>{entry.name}</span>
          {entry.is_dir && entry.items > 0 && (
            <CountBadge count={entry.items} />
          )}
        </span>
      </Table.Td>
      <Table.Td className={classes.sizeCol}>
        <SizeCell entry={entry} />
      </Table.Td>
      <Table.Td className={classes.muted}>
        {entry.is_dir ? FOLDER_KIND.label : fileKind(entry.name).label}
      </Table.Td>
      <Table.Td className={classes.muted}>
        {relativeTime(entry.modified)}
      </Table.Td>
    </Table.Tr>
  )
}
