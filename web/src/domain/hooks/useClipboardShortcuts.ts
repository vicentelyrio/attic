import { useHotkeys } from '@mantine/hooks'

import { type ClipboardRef, useClipboardActions } from '@domain'

/** Registers ⌘C / ⌘X / ⌘V for the current directory and selection. Mirrors the
 *  context-menu actions so the keyboard and the menu drive the same clipboard.
 *  Keys are only intercepted when there is something to act on, so native copy
 *  still works when no files are selected. Typing in inputs is ignored by
 *  `useHotkeys` (default `tagsToIgnore`), so the Spotlight search is unaffected. */
export function useClipboardShortcuts(
  root: string,
  path: string,
  selected: string[],
) {
  const { hasClipboard, copy, cut, paste } = useClipboardActions(root, path)

  const refs = (): ClipboardRef[] =>
    selected.map((name) => ({ root, path: path ? `${path}/${name}` : name }))

  useHotkeys([
    [
      'mod+C',
      (e) => {
        if (!selected.length) return
        e.preventDefault()
        copy(refs())
      },
      { preventDefault: false },
    ],
    [
      'mod+X',
      (e) => {
        if (!selected.length) return
        e.preventDefault()
        cut(refs())
      },
      { preventDefault: false },
    ],
    [
      'mod+V',
      (e) => {
        if (!hasClipboard) return
        e.preventDefault()
        paste()
      },
      { preventDefault: false },
    ],
  ])
}
