import type { SelectMods } from '@infrastructure'

import { Table } from '@mantine/core'

import type { Entry } from '@domain'

import type { RenameControls } from '../rename'
import classes from './list.module.css'
import { ListRow } from './list-row'

export type ListProps = {
  data?: Entry[]
  onOpen: (item: Entry) => void
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
  onClearSelection: () => void
  rename: RenameControls
}

export function List({
  data,
  onOpen,
  selected,
  onSelect,
  onClearSelection,
  rename,
}: ListProps) {
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
        <Table.Tbody>
          {data?.map((entry) => (
            <ListRow
              key={entry.name}
              entry={entry}
              selected={selected.has(entry.name)}
              onOpen={onOpen}
              onSelect={onSelect}
              renaming={rename.renaming === entry.name}
              renamePending={rename.pending}
              onRenameSubmit={rename.submit}
              onRenameCancel={rename.cancel}
            />
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )
}
