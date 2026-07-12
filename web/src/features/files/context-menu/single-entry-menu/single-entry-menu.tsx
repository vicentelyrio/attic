import { Menu } from '@mantine/core'

import type { Entry } from '@domain'

import classes from '../context-menu.module.css'
import type { ContextMenuState } from '../hooks'
import { EntryHeader, Shortcut } from '../menu-parts'

type SingleEntryMenuProps = {
  entry: Entry
  state: ContextMenuState
  onOpen: (entry: Entry) => void
  onQuickLook: () => void
}

export function SingleEntryMenu({
  entry,
  state,
  onOpen,
  onQuickLook,
}: SingleEntryMenuProps) {
  const {
    openHref,
    copy,
    cut,
    paste,
    hasClipboard,
    duplicate,
    isFavorite,
    toggleFavorite,
    downloadHref,
    share,
    linkCopied,
    openTrash,
  } = state

  return (
    <>
      <EntryHeader entry={entry} />

      {entry.is_dir ? (
        <Menu.Item
          onClick={() => onOpen(entry)}
          rightSection={<Shortcut>↵</Shortcut>}
        >
          Open
        </Menu.Item>
      ) : (
        <Menu.Item
          component="a"
          href={openHref(entry)}
          target="_blank"
          rel="noreferrer"
          rightSection={<Shortcut>↵</Shortcut>}
        >
          Open in New Tab
        </Menu.Item>
      )}

      <Menu.Item
        disabled={entry.is_dir}
        onClick={onQuickLook}
        rightSection={<Shortcut>Space</Shortcut>}
      >
        Quick Look
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        onClick={() => copy([entry])}
        rightSection={<Shortcut>⌘C</Shortcut>}
      >
        Copy
      </Menu.Item>
      <Menu.Item
        onClick={() => cut([entry])}
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
        onClick={() => duplicate([entry])}
        rightSection={<Shortcut>⌘D</Shortcut>}
      >
        Duplicate
      </Menu.Item>

      <Menu.Divider />

      {entry.is_dir && (
        <Menu.Item onClick={() => toggleFavorite(entry)}>
          {isFavorite(entry) ? 'Remove from Favorites' : 'Add to Favorites'}
        </Menu.Item>
      )}
      <Menu.Item disabled>Rename</Menu.Item>
      <Menu.Item
        component="a"
        href={downloadHref(entry, true)}
        disabled={entry.is_dir}
        rightSection={<Shortcut>⌘↓</Shortcut>}
      >
        Download
      </Menu.Item>
      <Menu.Item disabled={entry.is_dir} onClick={() => share(entry)}>
        {linkCopied ? 'Link copied' : 'Share…'}
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        className={classes.danger}
        onClick={() => openTrash([entry])}
        rightSection={<Shortcut>⌘⌫</Shortcut>}
      >
        Move to Trash
      </Menu.Item>
    </>
  )
}
