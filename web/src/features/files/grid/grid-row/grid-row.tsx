import type { MouseEvent } from 'react'

import type { Entry } from '@domain'

import classes from '../grid.module.css'
import { Card } from '@/features/files/card'
import type { RenameControls } from '@/features/files/rename'

export type GridRowProps = {
  entries: Entry[]
  root: string
  path: string
  selected: Set<string>
  selectedEntries: Entry[]
  onSelect: (entry: Entry, event: MouseEvent) => void
  onOpen: (entry: Entry) => void
  rename: RenameControls
}

export function GridRow({
  entries,
  root,
  path,
  selected,
  selectedEntries,
  onSelect,
  onOpen,
  rename,
}: GridRowProps) {
  const dragEntries = (entry: Entry) =>
    selected.has(entry.name) && selectedEntries.length > 1
      ? selectedEntries
      : [entry]

  return (
    <div className={classes.grid}>
      {entries.map((entry) => (
        <Card
          key={entry.name}
          entry={entry}
          root={root}
          path={path}
          dragEntries={dragEntries(entry)}
          selected={selected.has(entry.name)}
          onSelect={onSelect}
          onOpen={onOpen}
          renaming={rename.renaming === entry.name}
          renamePending={rename.pending}
          onRenameSubmit={rename.submit}
          onRenameCancel={rename.cancel}
        />
      ))}
    </div>
  )
}
