import type { ReactNode } from 'react'

import type { SelectMods } from '@infrastructure'

import { Menu, Stack } from '@mantine/core'

import type { Entry } from '@domain'

import { ConfirmTrashDialog } from './confirm-trash-dialog'
import classes from './context-menu.module.css'
import { EmptyMenu } from './empty-menu'
import { useContextMenu } from './hooks'
import { MultiEntryMenu } from './multi-entry-menu'
import { NewEntryDialog } from './new-entry-dialog'
import { SingleEntryMenu } from './single-entry-menu'

export type ContextMenuProps = {
  entries: Entry[]
  root: string
  path: string
  writable: boolean
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
  onOpen: (entry: Entry) => void
  onQuickLook: () => void
  onPreview: () => void
  onRename: (entry: Entry) => void
  children: ReactNode
}

export function ContextMenu({
  entries,
  root,
  path,
  writable,
  selected,
  onSelect,
  onOpen,
  onQuickLook,
  onPreview,
  onRename,
  children,
}: ContextMenuProps) {
  const menu = useContextMenu({ entries, root, path, selected, onSelect })
  const { target, list, single } = menu

  return (
    <>
      <Menu
        opened={!!target}
        onClose={menu.close}
        position="bottom-start"
        offset={4}
        width={244}
        shadow="lg"
        radius="md"
        withinPortal
        returnFocus={false}
        classNames={{
          dropdown: classes.dropdown,
          item: classes.item,
          divider: classes.divider,
        }}
      >
        <Menu.ContextMenu>
          <Stack flex={1} mih={0} gap={0} onContextMenu={menu.open}>
            {children}
          </Stack>
        </Menu.ContextMenu>

        <Menu.Dropdown>
          {target?.kind === 'empty' && (
            <EmptyMenu
              writable={writable}
              hasClipboard={menu.hasClipboard}
              onPaste={menu.paste}
              onNew={menu.openNew}
            />
          )}

          {single && (
            <SingleEntryMenu
              entry={single}
              state={menu}
              onOpen={onOpen}
              onQuickLook={onQuickLook}
              onPreview={onPreview}
              onRename={onRename}
            />
          )}

          {list.length > 1 && <MultiEntryMenu entries={list} state={menu} />}
        </Menu.Dropdown>
      </Menu>

      <NewEntryDialog
        kind={menu.newEntry}
        pending={menu.createPending}
        onSubmit={menu.createEntry}
        onClose={menu.closeNew}
      />

      <ConfirmTrashDialog
        entries={menu.confirmTrash}
        pending={menu.trashPending}
        onConfirm={menu.trash}
        onClose={menu.closeTrash}
      />
    </>
  )
}
