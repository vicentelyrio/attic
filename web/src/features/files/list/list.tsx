import { useMemo, useRef } from 'react'

import { useI18nContext } from '@i18n'
import {
  type SelectMods,
  type SortField,
  type SortState,
  toggleSortField,
} from '@infrastructure'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Table } from '@mantine/core'

import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react'

import type { Entry } from '@domain'

import { mergeRefs, useDroppableFolder } from '@features'

import type { RenameControls } from '../rename'
import classes from './list.module.css'
import { ListRow } from './list-row'

export type ListProps = {
  data?: Entry[]
  root: string
  path: string
  onOpen: (item: Entry) => void
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
  onClearSelection: () => void
  rename: RenameControls
  sort: SortState
  onSortChange: (sort: SortState) => void
}

const ROW_ESTIMATE = 44

export function List({
  data,
  root,
  path,
  onOpen,
  selected,
  onSelect,
  onClearSelection,
  rename,
  sort,
  onSortChange,
}: ListProps) {
  const { LL } = useI18nContext()

  const sortIcon = (field: SortField) =>
    sort.field === field &&
    (sort.direction === 'asc' ? (
      <CaretUpIcon className={classes.sortIcon} weight="bold" />
    ) : (
      <CaretDownIcon className={classes.sortIcon} weight="bold" />
    ))

  const sortableHead = (
    field: SortField,
    label: string,
    className?: string,
  ) => (
    <Table.Th
      className={[classes.head, classes.sortable, className]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSortChange(toggleSortField(sort, field))}
      aria-sort={
        sort.field === field
          ? sort.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined
      }
    >
      <span className={classes.headLabel}>
        {label}
        {sortIcon(field)}
      </span>
    </Table.Th>
  )

  const selectedEntries = useMemo(
    () => data?.filter((e) => selected.has(e.name)) ?? [],
    [data, selected],
  )

  const drop = useDroppableFolder({ scope: 'background', root, dir: path })

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: data?.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 10,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows[0]?.start ?? 0
  const paddingBottom =
    rowVirtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0)

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: background deselect on the scroll area
    <div
      ref={mergeRefs(scrollRef, drop.setNodeRef)}
      className={classes.scroll}
      data-drop-active={drop.dropActive || undefined}
      onClick={onClearSelection}
      onKeyDown={(e) => e.key === 'Escape' && onClearSelection()}
    >
      <Table
        className={classes.table}
        verticalSpacing={7}
        horizontalSpacing="md"
        stickyHeader
      >
        <colgroup>
          <col />
          <col className={classes.sizeColgroup} />
          <col className={classes.kindColgroup} />
          <col className={classes.modifiedColgroup} />
        </colgroup>
        <Table.Thead className={classes.thead}>
          <Table.Tr>
            {sortableHead('name', LL.common.name())}
            {sortableHead('size', LL.common.size(), classes.sizeCol)}
            {sortableHead('kind', LL.common.kind())}
            {sortableHead('modified', LL.common.modified())}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paddingTop > 0 && (
            <tr>
              <td
                colSpan={4}
                style={{ height: paddingTop, padding: 0, border: 0 }}
              />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const entry = data?.[virtualRow.index]
            if (!entry) return null
            return (
              <ListRow
                key={entry.name}
                measureRef={rowVirtualizer.measureElement}
                dataIndex={virtualRow.index}
                entry={entry}
                root={root}
                path={path}
                dragEntries={
                  selected.has(entry.name) && selectedEntries.length > 1
                    ? selectedEntries
                    : [entry]
                }
                selected={selected.has(entry.name)}
                onOpen={onOpen}
                onSelect={onSelect}
                renaming={rename.renaming === entry.name}
                renamePending={rename.pending}
                onRenameSubmit={rename.submit}
                onRenameCancel={rename.cancel}
              />
            )
          })}
          {paddingBottom > 0 && (
            <tr>
              <td
                colSpan={4}
                style={{ height: paddingBottom, padding: 0, border: 0 }}
              />
            </tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  )
}
