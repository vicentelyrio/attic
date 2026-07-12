import type { SelectMods } from '@infrastructure'

import { useHotkeys } from '@mantine/hooks'

import type { Entry } from '@domain'

import { useContextMenuTarget } from './use-context-menu-target'
import { useEntryClipboard } from './use-entry-clipboard'
import { useEntryMeta } from './use-entry-meta'
import { useEntryMutations } from './use-entry-mutations'

type UseContextMenuParams = {
  entries: Entry[]
  root: string
  path: string
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
}

export function useContextMenu({
  entries,
  root,
  path,
  selected,
  onSelect,
}: UseContextMenuParams) {
  const target = useContextMenuTarget(entries, selected, onSelect)
  const clipboard = useEntryClipboard(root, path)
  const meta = useEntryMeta(root, path)
  const mutations = useEntryMutations(root, path)

  const trashSelected = () => {
    if (target.selectedEntries.length)
      mutations.openTrash(target.selectedEntries)
  }

  useHotkeys([
    ['Delete', trashSelected],
    ['Backspace', trashSelected],
    ['mod+Backspace', trashSelected],
  ])

  return { ...target, ...clipboard, ...meta, ...mutations }
}

export type ContextMenuState = ReturnType<typeof useContextMenu>
