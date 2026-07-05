import type { ClipboardRef } from '@domain'

import { useClipboard } from './useClipboard'
import { usePaste } from './useJobs'

export function useClipboardActions(root: string, path: string) {
  const { clipboard, copy, cut, clear } = useClipboard()
  const pasteMut = usePaste()

  const hasClipboard = !!clipboard && clipboard.items.length > 0

  const paste = async () => {
    if (!clipboard || clipboard.items.length === 0) return
    const op = clipboard.op === 'cut' ? 'move' : 'copy'
    for (const item of clipboard.items) {
      await pasteMut.mutateAsync({
        op,
        src_root: item.root,
        src_path: item.path,
        dst_root: root,
        dst_dir: path,
      })
    }
    if (clipboard.op === 'cut') clear()
  }

  const copyRefs = (items: ClipboardRef[]) => copy(items)
  const cutRefs = (items: ClipboardRef[]) => cut(items)

  return { clipboard, hasClipboard, copy: copyRefs, cut: cutRefs, paste }
}
