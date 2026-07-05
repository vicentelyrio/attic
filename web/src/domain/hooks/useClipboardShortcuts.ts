import { useHotkeys } from '@mantine/hooks'

import { type ClipboardRef, useClipboardActions } from '@domain'

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
