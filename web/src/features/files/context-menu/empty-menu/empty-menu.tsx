import { Menu } from '@mantine/core'

import { ReadOnly, Shortcut } from '../menu-parts'
import type { NewEntryKind } from '../new-entry-dialog'

type EmptyMenuProps = {
  writable: boolean
  hasClipboard: boolean
  onPaste: () => void
  onNew: (kind: NewEntryKind) => void
}

export function EmptyMenu({
  writable,
  hasClipboard,
  onPaste,
  onNew,
}: EmptyMenuProps) {
  return (
    <>
      <Menu.Item
        disabled={!hasClipboard}
        onClick={onPaste}
        rightSection={<Shortcut>⌘V</Shortcut>}
      >
        Paste
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        disabled={!writable}
        onClick={() => onNew('folder')}
        rightSection={writable ? undefined : <ReadOnly />}
      >
        New Folder
      </Menu.Item>
      <Menu.Item
        disabled={!writable}
        onClick={() => onNew('file')}
        rightSection={writable ? undefined : <ReadOnly />}
      >
        New File
      </Menu.Item>
    </>
  )
}
