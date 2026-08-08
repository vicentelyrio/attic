import { useMemo, useRef } from 'react'

import { useI18nContext } from '@i18n'
import type { SelectMods } from '@infrastructure'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Table } from '@mantine/core'

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
}: ListProps) {
  const { LL } = useI18nContext()

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
            <Table.Th className={classes.head}>{LL.common.name()}</Table.Th>
            <Table.Th className={`${classes.head} ${classes.sizeCol}`}>
              {LL.common.size()}
            </Table.Th>
            <Table.Th className={classes.head}>{LL.common.kind()}</Table.Th>
            <Table.Th className={classes.head}>{LL.common.modified()}</Table.Th>
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
