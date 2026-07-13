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
import { RenameField } from '../../rename'
import classes from '../list.module.css'
import { SizeCell } from '../size-cell'

export function ListRow({
  entry,
  selected,
  onOpen,
  onSelect,
  renaming,
  renamePending,
  onRenameSubmit,
  onRenameCancel,
}: {
  entry: Entry
  selected: boolean
  onOpen: (item: Entry) => void
  onSelect: (name: string, mods: SelectMods) => void
  renaming: boolean
  renamePending: boolean
  onRenameSubmit: (entry: Entry, name: string) => void
  onRenameCancel: () => void
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
        if (renaming) return
        onSelect(entry.name, {
          shift: e.shiftKey,
          toggle: e.metaKey || e.ctrlKey,
        })
      }}
      onDoubleClick={() => !renaming && onOpen(entry)}
    >
      <Table.Td>
        <span className={classes.name}>
          <EntryIcon name={entry.name} isDir={entry.is_dir} />
          {renaming ? (
            <RenameField
              entry={entry}
              pending={renamePending}
              onSubmit={(name) => onRenameSubmit(entry, name)}
              onCancel={onRenameCancel}
            />
          ) : (
            <span className={classes.label}>{entry.name}</span>
          )}
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
