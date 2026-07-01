import { useLocalStorage } from '@mantine/hooks'
import type { Clipboard, ClipboardRef } from '@domain'

/** The copy/cut clipboard. Pure intent (refs + operation) persisted in
 *  localStorage, so it survives a tab close/reopen — the actual bytes only
 *  ever move server-side on paste. */
export function useClipboard() {
  const [clipboard, setClipboard] = useLocalStorage<Clipboard | null>({
    key: 'files:clipboard',
    defaultValue: null,
    getInitialValueInEffect: false,
  })

  const copy = (items: ClipboardRef[]) => setClipboard({ op: 'copy', items })
  const cut = (items: ClipboardRef[]) => setClipboard({ op: 'cut', items })
  const clear = () => setClipboard(null)

  return { clipboard, copy, cut, clear }
}
