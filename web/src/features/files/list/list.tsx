import {
  FOLDER_KIND,
  fileKind,
  relativeTime,
  type SelectMods,
  sizeParts,
} from '@infrastructure'
import { Table } from '@mantine/core'
import type { Entry } from '@domain'
import { CountBadge } from '../count-badge'
import { EntryIcon } from '../entry-icon'
import classes from './list.module.css'

export type ListProps = {
  data?: Entry[]
  onOpen: (item: Entry) => void
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
  onClearSelection: () => void
  onContextEntry: (item: Entry) => void
}

function SizeCell({ entry }: { entry: Entry }) {
  if (entry.is_dir) return <span className={classes.dash}>—</span>

  const { value, unit } = sizeParts(entry.size)
  return (
    <>
      {value} <span className={classes.unit}>{unit}</span>
    </>
  )
}

export function List({
  data,
  onOpen,
  selected,
  onSelect,
  onClearSelection,
  onContextEntry,
}: ListProps) {
  const rows = data?.map((entry) => (
    <Table.Tr
      key={entry.name}
      className={[
        selected.has(entry.name) ? classes.selected : classes.row,
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
      onContextMenu={() => onContextEntry(entry)}
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
  ))

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: background deselect on the scroll area
    <div
      className={classes.scroll}
      onClick={onClearSelection}
      onKeyDown={(e) => e.key === 'Escape' && onClearSelection()}
    >
      <Table
        className={classes.table}
        verticalSpacing={7}
        horizontalSpacing="md"
        stickyHeader
      >
        <Table.Thead className={classes.thead}>
          <Table.Tr>
            <Table.Th className={classes.head}>Name</Table.Th>
            <Table.Th className={`${classes.head} ${classes.sizeCol}`}>
              Size
            </Table.Th>
            <Table.Th className={classes.head}>Kind</Table.Th>
            <Table.Th className={classes.head}>Modified</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </div>
  )
}
