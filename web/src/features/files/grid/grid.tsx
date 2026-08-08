import { type MouseEvent, useMemo, useRef } from 'react'

import { useI18nContext } from '@i18n'
import type { SelectMods } from '@infrastructure'

import { Box } from '@mantine/core'

import type { Entry } from '@domain'

import { mergeRefs, useDroppableFolder } from '@features'

import type { RenameControls } from '../rename'
import classes from './grid.module.css'
import { GridRow } from './grid-row'
import { SectionLabel } from './grid-section'
import { partitionEntries } from './helpers'
import { useVirtualGrid } from './hooks'

export type GridProps = {
  data?: Entry[]
  root: string
  path: string
  onOpen: (item: Entry) => void
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
  onClearSelection: () => void
  rename: RenameControls
}

export function Grid({
  data,
  root,
  path,
  onOpen,
  selected,
  onSelect,
  onClearSelection,
  rename,
}: GridProps) {
  const { LL } = useI18nContext()
  const { folders, files } = useMemo(() => partitionEntries(data), [data])

  const selectedEntries = useMemo(
    () => data?.filter((e) => selected.has(e.name)) ?? [],
    [data, selected],
  )

  const handleSelect = (entry: Entry, event: MouseEvent) => {
    event.stopPropagation()
    onSelect(entry.name, {
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    })
  }

  const drop = useDroppableFolder({ scope: 'background', root, dir: path })

  const scrollRef = useRef<HTMLDivElement>(null)
  const { rows, virtualizer } = useVirtualGrid({
    scrollRef,
    folders,
    files,
    folderLabel: LL.files.folders(),
    fileLabel: LL.files.files(),
  })

  return (
    <Box
      ref={mergeRefs(scrollRef, drop.setNodeRef)}
      className={classes.scroll}
      data-drop-active={drop.dropActive || undefined}
      onClick={onClearSelection}
      onKeyDown={(e) => e.key === 'Escape' && onClearSelection()}
    >
      <div style={{ position: 'relative', height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          if (!row) return null

          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${virtualRow.start}px)`,
                paddingTop:
                  row.type === 'header' && virtualRow.index > 0
                    ? 'var(--mantine-spacing-xl)'
                    : 0,
                paddingBottom:
                  row.type === 'header'
                    ? 'var(--mantine-spacing-sm)'
                    : 'var(--mantine-spacing-md)',
              }}
            >
              {row.type === 'header' ? (
                <SectionLabel label={row.label} />
              ) : (
                <GridRow
                  entries={row.entries}
                  root={root}
                  path={path}
                  selected={selected}
                  selectedEntries={selectedEntries}
                  onSelect={handleSelect}
                  onOpen={onOpen}
                  rename={rename}
                />
              )}
            </div>
          )
        })}
      </div>
    </Box>
  )
}
