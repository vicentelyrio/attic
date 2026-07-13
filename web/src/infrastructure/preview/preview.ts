import { useCallback, useMemo, useState } from 'react'

import { useHotkeys } from '@mantine/hooks'

import type { Entry } from '@domain'

import { SHORTCUTS } from '../shortcuts'

export function useFullscreenPreview(selected: Set<string>, entries?: Entry[]) {
  const files = useMemo(
    () => entries?.filter((e) => !e.is_dir) ?? [],
    [entries],
  )

  const [index, setIndex] = useState<number | null>(null)

  const startIndex = useCallback(() => {
    if (files.length === 0) return null
    const [name] = selected
    const at = files.findIndex((f) => f.name === name)
    return at >= 0 ? at : 0
  }, [files, selected])

  const open = useCallback(() => setIndex(startIndex()), [startIndex])
  const close = useCallback(() => setIndex(null), [])

  const next = useCallback(() => {
    setIndex((i) => (i === null ? i : (i + 1) % files.length))
  }, [files.length])

  const prev = useCallback(() => {
    setIndex((i) => (i === null ? i : (i - 1 + files.length) % files.length))
  }, [files.length])

  useHotkeys([
    [
      SHORTCUTS.fullscreen.hotkey,
      () => setIndex((i) => (i !== null ? null : startIndex())),
    ],
  ])

  return {
    entry: index !== null ? files[index] : undefined,
    index: index ?? 0,
    total: files.length,
    open,
    close,
    next,
    prev,
  }
}
