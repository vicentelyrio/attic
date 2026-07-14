import type { SelectMods } from '@infrastructure'

import { Box, Stack } from '@mantine/core'

import type { Entry } from '@domain'

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
  const { folders, files, handleSelect, handleOpen } = useGrid(
    data,
    onSelect,
    onOpen,
  )

  const cardRename = (entry: Entry) => ({
    renaming: rename.renaming === entry.name,
    renamePending: rename.pending,
    onRenameSubmit: rename.submit,
    onRenameCancel: rename.cancel,
  })

  return (
    <Box
      className={classes.scroll}
      onClick={onClearSelection}
      onKeyDown={(e) => e.key === 'Escape' && onClearSelection()}
    >
      <Stack gap="xl">
        {folders.length > 0 && (
          <GridSection label="Folders" autoFill>
            {folders.map((entry) => (
              <Card
                key={entry.name}
                entry={entry}
                root={root}
                path={path}
                selected={selected.has(entry.name)}
                onSelect={handleSelect}
                onOpen={handleOpen}
                {...cardRename(entry)}
              />
            ))}
          </GridSection>
        )}

        {files.length > 0 && (
          <GridSection label="Files">
            {files.map((entry) => (
              <Card
                key={entry.name}
                entry={entry}
                root={root}
                path={path}
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
