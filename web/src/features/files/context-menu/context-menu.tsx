import { type MouseEvent, type ReactNode, useMemo, useState } from 'react'

import { FOLDER_KIND, fileKind, type SelectMods, size } from '@infrastructure'

import { Group, Menu, Stack, Text } from '@mantine/core'
import { useClipboard as useCopyToClipboard, useHotkeys } from '@mantine/hooks'

import {
  type ClipboardRef,
  downloadUrl,
  type Entry,
  useClipboardActions,
  useFileOps,
} from '@domain'

import { EntryIcon } from '../entry-icon'
import { ConfirmTrashDialog } from './confirm-trash-dialog'
import classes from './context-menu.module.css'
import { NewEntryDialog, type NewEntryKind } from './new-entry-dialog'

export type ContextMenuProps = {
  /** The entries currently shown, used to resolve the right-clicked row. */
  entries: Entry[]
  root: string
  path: string
  selected: Set<string>
  /** Fix the selection when right-clicking a row outside the current one. */
  onSelect: (name: string, mods: SelectMods) => void
  /** Open a folder (navigate); files open via their view URL. */
  onOpen: (entry: Entry) => void
  /** Reveal the detail panel for the current selection. */
  onQuickLook: () => void
  children: ReactNode
}

/** What the menu acts on: one or more entries, or the empty listing space. */
type Target = { kind: 'entries'; entries: Entry[] } | { kind: 'empty' } | null

function Shortcut({ children }: { children: ReactNode }) {
  return <Text className={classes.shortcut}>{children}</Text>
}

function EntryHeader({ entry }: { entry: Entry }) {
  const kind = entry.is_dir ? FOLDER_KIND : fileKind(entry.name)
  const meta = entry.is_dir
    ? `Folder · ${entry.items} ${entry.items === 1 ? 'item' : 'items'}`
    : `${kind.label} · ${size(entry.size)}`

  return (
    <Group gap="sm" wrap="nowrap" p="xs" className={classes.header}>
      <EntryIcon name={entry.name} isDir={entry.is_dir} />
      <Stack gap={0} miw={0}>
        <Text size="sm" fw={600} c="dark.0" truncate>
          {entry.name}
        </Text>
        <Text size="xs" c="dark.3" truncate>
          {meta}
        </Text>
      </Stack>
    </Group>
  )
}

function CountHeader({ count }: { count: number }) {
  return (
    <Group gap="sm" wrap="nowrap" p="xs" className={classes.header}>
      <Text size="sm" fw={600} c="dark.0">
        {count} items selected
      </Text>
    </Group>
  )
}

/** Right-click menu for the directory listing. Rendered once around the
 *  listing; `Menu.ContextMenu` anchors the dropdown to the cursor, and the
 *  right-clicked row (or the empty space) is resolved from the event target. */
export function ContextMenu({
  entries,
  root,
  path,
  selected,
  onSelect,
  onOpen,
  onQuickLook,
  children,
}: ContextMenuProps) {
  const { hasClipboard, copy, cut, paste } = useClipboardActions(root, path)
  const { mkdir, touch, duplicate, remove } = useFileOps(root, path)
  const link = useCopyToClipboard({ timeout: 1200 })

  const [target, setTarget] = useState<Target>(null)
  const [newEntry, setNewEntry] = useState<NewEntryKind | null>(null)
  const [confirmTrash, setConfirmTrash] = useState<Entry[] | null>(null)

  const rel = (e: Entry) => (path ? `${path}/${e.name}` : e.name)
  const ref = (e: Entry): ClipboardRef => ({ root, path: rel(e) })
  const refs = (list: Entry[]) => list.map(ref)

  const doShare = (e: Entry) =>
    link.copy(`${location.origin}${downloadUrl(root, rel(e))}`)

  const createEntry = (name: string) => {
    const op = newEntry === 'folder' ? mkdir : touch
    op.mutate(name, { onSuccess: () => setNewEntry(null) })
  }

  // Delete / ⌘⌫ trashes the current selection. Routes through the same confirm
  // dialog as the menu action. `useHotkeys` ignores keystrokes typed in inputs,
  // so this never fires while searching or naming a new entry.
  const selectedEntries = useMemo(
    () => entries.filter((e) => selected.has(e.name)),
    [entries, selected],
  )
  const trashSelected = () => {
    if (selectedEntries.length) setConfirmTrash(selectedEntries)
  }
  useHotkeys([
    ['Delete', trashSelected],
    ['Backspace', trashSelected],
    ['mod+Backspace', trashSelected],
  ])

  const onContextMenu = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest('[data-name]')
    const name = el?.getAttribute('data-name')

    if (!name) {
      setTarget({ kind: 'empty' })
      return
    }

    const names = selected.has(name) ? selected : new Set([name])
    if (!selected.has(name)) onSelect(name, { shift: false, toggle: false })

    setTarget({
      kind: 'entries',
      entries: entries.filter((e) => names.has(e.name)),
    })
  }

  const list = target?.kind === 'entries' ? target.entries : []
  const single = list.length === 1 ? list[0] : null

  return (
    <>
      <Menu
        opened={!!target}
        onClose={() => setTarget(null)}
        position="bottom-start"
        offset={4}
        width={244}
        shadow="lg"
        radius="md"
        withinPortal
        classNames={{
          dropdown: classes.dropdown,
          item: classes.item,
          divider: classes.divider,
        }}
      >
        <Menu.ContextMenu>
          <Stack flex={1} mih={0} gap={0} onContextMenu={onContextMenu}>
            {children}
          </Stack>
        </Menu.ContextMenu>

        <Menu.Dropdown>
          {target?.kind === 'empty' && (
            <>
              <Menu.Item
                disabled={!hasClipboard}
                onClick={paste}
                rightSection={<Shortcut>⌘V</Shortcut>}
              >
                Paste
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item onClick={() => setNewEntry('folder')}>
                New Folder
              </Menu.Item>
              <Menu.Item onClick={() => setNewEntry('file')}>
                New File
              </Menu.Item>
            </>
          )}

          {single && (
            <>
              <EntryHeader entry={single} />

              {single.is_dir ? (
                <Menu.Item
                  onClick={() => onOpen(single)}
                  rightSection={<Shortcut>↵</Shortcut>}
                >
                  Open
                </Menu.Item>
              ) : (
                <Menu.Item
                  component="a"
                  href={downloadUrl(root, rel(single))}
                  target="_blank"
                  rel="noreferrer"
                  rightSection={<Shortcut>↵</Shortcut>}
                >
                  Open in New Tab
                </Menu.Item>
              )}

              <Menu.Item
                disabled={single.is_dir}
                onClick={onQuickLook}
                rightSection={<Shortcut>Space</Shortcut>}
              >
                Quick Look
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                onClick={() => copy(refs([single]))}
                rightSection={<Shortcut>⌘C</Shortcut>}
              >
                Copy
              </Menu.Item>
              <Menu.Item
                onClick={() => cut(refs([single]))}
                rightSection={<Shortcut>⌘X</Shortcut>}
              >
                Cut
              </Menu.Item>
              <Menu.Item
                disabled={!hasClipboard}
                onClick={paste}
                rightSection={<Shortcut>⌘V</Shortcut>}
              >
                Paste
              </Menu.Item>
              <Menu.Item
                onClick={() => duplicate.mutate([single])}
                rightSection={<Shortcut>⌘D</Shortcut>}
              >
                Duplicate
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item disabled>Rename</Menu.Item>
              <Menu.Item
                component="a"
                href={downloadUrl(root, rel(single), true)}
                disabled={single.is_dir}
                rightSection={<Shortcut>⌘↓</Shortcut>}
              >
                Download
              </Menu.Item>
              <Menu.Item
                disabled={single.is_dir}
                onClick={() => doShare(single)}
              >
                {link.copied ? 'Link copied' : 'Share…'}
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                className={classes.danger}
                onClick={() => setConfirmTrash([single])}
                rightSection={<Shortcut>⌘⌫</Shortcut>}
              >
                Move to Trash
              </Menu.Item>
            </>
          )}

          {list.length > 1 && (
            <>
              <CountHeader count={list.length} />

              <Menu.Item
                onClick={() => copy(refs(list))}
                rightSection={<Shortcut>⌘C</Shortcut>}
              >
                Copy
              </Menu.Item>
              <Menu.Item
                onClick={() => cut(refs(list))}
                rightSection={<Shortcut>⌘X</Shortcut>}
              >
                Cut
              </Menu.Item>
              <Menu.Item
                disabled={!hasClipboard}
                onClick={paste}
                rightSection={<Shortcut>⌘V</Shortcut>}
              >
                Paste
              </Menu.Item>
              <Menu.Item
                onClick={() => duplicate.mutate(list)}
                rightSection={<Shortcut>⌘D</Shortcut>}
              >
                Duplicate
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                className={classes.danger}
                onClick={() => setConfirmTrash(list)}
                rightSection={<Shortcut>⌘⌫</Shortcut>}
              >
                Move to Trash
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      <NewEntryDialog
        kind={newEntry}
        pending={mkdir.isPending || touch.isPending}
        onSubmit={createEntry}
        onClose={() => setNewEntry(null)}
      />

      <ConfirmTrashDialog
        entries={confirmTrash}
        pending={remove.isPending}
        onConfirm={() =>
          confirmTrash &&
          remove.mutate(confirmTrash, {
            onSuccess: () => setConfirmTrash(null),
          })
        }
        onClose={() => setConfirmTrash(null)}
      />
    </>
  )
}
