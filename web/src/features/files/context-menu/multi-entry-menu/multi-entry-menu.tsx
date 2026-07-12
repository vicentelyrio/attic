import { Menu } from '@mantine/core'

import type { Entry } from '@domain'

import classes from '../context-menu.module.css'
import type { ContextMenuState } from '../hooks'
import { CountHeader, Shortcut } from '../menu-parts'

type MultiEntryMenuProps = {
  entries: Entry[]
  state: ContextMenuState
}

export function MultiEntryMenu({ entries, state }: MultiEntryMenuProps) {
  const { copy, cut, paste, hasClipboard, duplicate, openTrash } = state

  return (
    <>
      <CountHeader count={entries.length} />

      <Menu.Item
        onClick={() => copy(entries)}
        rightSection={<Shortcut>⌘C</Shortcut>}
      >
        Copy
      </Menu.Item>
      <Menu.Item
        onClick={() => cut(entries)}
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
        onClick={() => duplicate(entries)}
        rightSection={<Shortcut>⌘D</Shortcut>}
      >
        Duplicate
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        className={classes.danger}
        onClick={() => openTrash(entries)}
        rightSection={<Shortcut>⌘⌫</Shortcut>}
      >
        Move to Trash
      </Menu.Item>
    </>
  )
}
