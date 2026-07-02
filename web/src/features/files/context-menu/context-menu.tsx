import { FOLDER_KIND, fileKind, size } from '@infrastructure'
import { Group, Menu, Stack, Text } from '@mantine/core'
import { useClipboard as useCopyToClipboard } from '@mantine/hooks'
import { CaretRightIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import {
  type ClipboardRef,
  downloadUrl,
  type Entry,
  useClipboard,
  usePaste,
} from '@domain'
import { EntryIcon } from '../entry-icon'
import classes from './context-menu.module.css'

export type ContextMenuProps = {
  /** The right-clicked entry, or `null` when the menu is closed. */
  entry: Entry | null
  root: string
  path: string
  /** Open a folder (navigate); files are opened via their view URL. */
  onOpen: (entry: Entry) => void
  /** Reveal the detail panel for the current selection. */
  onGetInfo: () => void
  onClose: () => void
  children: ReactNode
}

function Shortcut({ children }: { children: ReactNode }) {
  return <Text className={classes.shortcut}>{children}</Text>
}

function Header({ entry }: { entry: Entry }) {
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

/** Right-click menu for a directory entry. Rendered once around the listing;
 *  `Menu.ContextMenu` anchors the dropdown to the cursor, and the active entry
 *  is supplied by whichever row/card was right-clicked. */
export function ContextMenu({
  entry,
  root,
  path,
  onOpen,
  onGetInfo,
  onClose,
  children,
}: ContextMenuProps) {
  const { clipboard, copy, cut, clear } = useClipboard()
  const paste = usePaste()
  const link = useCopyToClipboard({ timeout: 1200 })

  const hasClipboard = !!clipboard && clipboard.items.length > 0

  const rel = (e: Entry) => (path ? `${path}/${e.name}` : e.name)
  const ref = (e: Entry): ClipboardRef => ({ root, path: rel(e) })

  const doPaste = async () => {
    if (!clipboard || clipboard.items.length === 0) return
    const op = clipboard.op === 'cut' ? 'move' : 'copy'
    for (const item of clipboard.items) {
      await paste.mutateAsync({
        op,
        src_root: item.root,
        src_path: item.path,
        dst_root: root,
        dst_dir: path,
      })
    }
    if (clipboard.op === 'cut') clear()
  }

  const doShare = (e: Entry) =>
    link.copy(`${location.origin}${downloadUrl(root, rel(e))}`)

  const isDir = entry?.is_dir ?? false
  const viewUrl = entry && !isDir ? downloadUrl(root, rel(entry)) : undefined

  return (
    <Menu
      opened={!!entry}
      onClose={onClose}
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
        <Stack flex={1} mih={0} gap={0}>
          {children}
        </Stack>
      </Menu.ContextMenu>

      <Menu.Dropdown>
        {entry && (
          <>
            <Header entry={entry} />

            {isDir ? (
              <Menu.Item
                onClick={() => onOpen(entry)}
                rightSection={<Shortcut>↵</Shortcut>}
              >
                Open
              </Menu.Item>
            ) : (
              <Menu.Item
                component="a"
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                rightSection={<Shortcut>↵</Shortcut>}
              >
                Open
              </Menu.Item>
            )}

            <Menu.Sub disabled={isDir}>
              <Menu.Sub.Target>
                <Menu.Sub.Item
                  className={classes.item}
                  rightSection={
                    <CaretRightIcon size={14} className={classes.chevron} />
                  }
                >
                  Open With
                </Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown classNames={{ dropdown: classes.dropdown }}>
                <Menu.Item
                  className={classes.item}
                  component="a"
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  New Tab
                </Menu.Item>
                <Menu.Item
                  className={classes.item}
                  component="a"
                  href={entry && downloadUrl(root, rel(entry), true)}
                >
                  Download
                </Menu.Item>
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Item
              disabled={isDir}
              onClick={onGetInfo}
              rightSection={<Shortcut>Space</Shortcut>}
            >
              Quick Look
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              onClick={() => copy([ref(entry)])}
              rightSection={<Shortcut>⌘C</Shortcut>}
            >
              Copy
            </Menu.Item>
            <Menu.Item
              onClick={() => cut([ref(entry)])}
              rightSection={<Shortcut>⌘X</Shortcut>}
            >
              Cut
            </Menu.Item>
            <Menu.Item
              disabled={!hasClipboard}
              onClick={doPaste}
              rightSection={<Shortcut>⌘V</Shortcut>}
            >
              Paste
            </Menu.Item>
            <Menu.Item disabled rightSection={<Shortcut>⌘D</Shortcut>}>
              Duplicate
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item disabled>Rename</Menu.Item>
            <Menu.Item
              component="a"
              href={entry && downloadUrl(root, rel(entry), true)}
              disabled={isDir}
              rightSection={<Shortcut>⌘↓</Shortcut>}
            >
              Download
            </Menu.Item>
            <Menu.Item disabled={isDir} onClick={() => doShare(entry)}>
              {link.copied ? 'Link copied' : 'Share…'}
            </Menu.Item>
            <Menu.Item
              disabled={isDir}
              onClick={onGetInfo}
              rightSection={<Shortcut>⌘I</Shortcut>}
            >
              Get Info
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              disabled
              className={classes.danger}
              rightSection={<Shortcut>⌘⌫</Shortcut>}
            >
              Move to Trash
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
