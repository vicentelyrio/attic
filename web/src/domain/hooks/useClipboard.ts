import { useLocalStorage } from '@mantine/hooks'

import type { Clipboard, ClipboardRef } from '@domain'

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
