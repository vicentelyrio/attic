import { useMemo, useState } from 'react'

import { useHotkeys } from '@mantine/hooks'

import type { Entry } from '@domain'

import { SHORTCUTS } from '../shortcuts'

export function useDetailPanel(
  selected: Set<string>,
  entries?: Entry[],
  suspended = false,
) {
  const [open, setOpen] = useState(false)

  const selectedFile = useMemo(() => {
    if (selected.size !== 1) return undefined
    const [name] = selected
    return entries?.find((e) => e.name === name && !e.is_dir)
  }, [selected, entries])

  useHotkeys([
    [
      SHORTCUTS.quickLook.hotkey,
      () => {
        if (!suspended && selectedFile) setOpen((prev) => !prev)
      },
    ],
    ['Escape', () => !suspended && setOpen(false), { preventDefault: false }],
  ])

  return {
    entry: open ? selectedFile : undefined,
    open: () => setOpen(true),
    close: () => setOpen(false),
  }
}
