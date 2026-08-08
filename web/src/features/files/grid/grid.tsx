import { useMemo } from 'react'

import { useI18nContext } from '@i18n'
import type { SelectMods } from '@infrastructure'

import { Box, Stack } from '@mantine/core'

import type { Entry } from '@domain'

import { useDroppableFolder } from '@features'

import { Card } from '../card'
import type { RenameControls } from '../rename'
import classes from './grid.module.css'
import { GridSection } from './grid-section'
import { useGrid } from './hooks'

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
  const { folders, files, handleSelect, handleOpen } = useGrid(
    data,
    onSelect,
    onOpen,
  )

  const selectedEntries = useMemo(
    () => data?.filter((e) => selected.has(e.name)) ?? [],
    [data, selected],
  )
  const dragEntries = (entry: Entry) =>
    selected.has(entry.name) && selectedEntries.length > 1
      ? selectedEntries
      : [entry]

  const cardRename = (entry: Entry) => ({
    renaming: rename.renaming === entry.name,
    renamePending: rename.pending,
    onRenameSubmit: rename.submit,
    onRenameCancel: rename.cancel,
  })

  const drop = useDroppableFolder({ scope: 'background', root, dir: path })

  return (
    <Box
      ref={drop.setNodeRef}
      className={classes.scroll}
      data-drop-active={drop.dropActive || undefined}
      onClick={onClearSelection}
      onKeyDown={(e) => e.key === 'Escape' && onClearSelection()}
    >
      <Stack gap="xl">
        {folders.length > 0 && (
          <GridSection label={LL.files.folders()} autoFill>
            {folders.map((entry) => (
              <Card
                key={entry.name}
                entry={entry}
                root={root}
                path={path}
                dragEntries={dragEntries(entry)}
                selected={selected.has(entry.name)}
                onSelect={handleSelect}
                onOpen={handleOpen}
                {...cardRename(entry)}
              />
            ))}
          </GridSection>
        )}

        {files.length > 0 && (
          <GridSection label={LL.files.files()}>
            {files.map((entry) => (
              <Card
                key={entry.name}
                entry={entry}
                root={root}
                path={path}
                dragEntries={dragEntries(entry)}
                selected={selected.has(entry.name)}
                onSelect={handleSelect}
                onOpen={handleOpen}
                {...cardRename(entry)}
              />
            ))}
          </GridSection>
        )}
      </Stack>
    </Box>
  )
}
