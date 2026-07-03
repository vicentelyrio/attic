import { useHotkeys } from '@mantine/hooks'

import { type ClipboardRef, useClipboard, usePaste } from '@domain'

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
  const { clipboard, copy, cut, clear } = useClipboard()
  const paste = usePaste()

  const refs = (): ClipboardRef[] =>
    selected.map((name) => ({ root, path: path ? `${path}/${name}` : name }))

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
        if (!clipboard || clipboard.items.length === 0) return
        e.preventDefault()
        doPaste()
      },
      { preventDefault: false },
    ],
  ])
}
