import { kindLabel, useI18nContext } from '@i18n'
import {
  FOLDER_KIND,
  fileKind,
  relativeTime,
  type SelectMods,
} from '@infrastructure'

import { Table } from '@mantine/core'

import type { Entry } from '@domain'

import { mergeRefs, useDraggableEntry, useDroppableFolder } from '@features'

import { CountBadge } from '../../count-badge'
import { EntryIcon } from '../../entry-icon'
import { RenameField } from '../../rename'
import classes from '../list.module.css'
import { SizeCell } from '../size-cell'

export function ListRow({
  entry,
  root,
  path,
  dragEntries,
  selected,
  onOpen,
  onSelect,
  renaming,
  renamePending,
  onRenameSubmit,
  onRenameCancel,
}: {
  entry: Entry
  root: string
  path: string
  dragEntries: Entry[]
  selected: boolean
  onOpen: (item: Entry) => void
  onSelect: (name: string, mods: SelectMods) => void
  renaming: boolean
  renamePending: boolean
  onRenameSubmit: (entry: Entry, name: string) => void
  onRenameCancel: () => void
}) {
  const { LL } = useI18nContext()

  const drag = useDraggableEntry({
    root,
    path,
    entry,
    dragEntries,
    disabled: renaming,
  })
  const drop = useDroppableFolder({
    root,
    dir: path ? `${path}/${entry.name}` : entry.name,
    disabled: !entry.is_dir,
  })

  return (
    <Table.Tr
      ref={mergeRefs(drag.setNodeRef, drop.setNodeRef)}
      data-name={entry.name}
      data-drop-active={drop.dropActive || undefined}
      data-drop-invalid={drop.dropInvalid || undefined}
      className={[
        selected ? classes.selected : classes.row,
        entry.name.startsWith('.') && classes.dimmed,
        drag.isDragging && classes.dragging,
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
      {...drag.attributes}
      {...drag.listeners}
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
        {kindLabel(LL, entry.is_dir ? FOLDER_KIND : fileKind(entry.name))}
      </Table.Td>
      <Table.Td className={classes.muted}>
        {relativeTime(entry.modified)}
      </Table.Td>
    </Table.Tr>
  )
}
