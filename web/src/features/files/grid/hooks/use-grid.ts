import { type MouseEvent, useCallback, useMemo, useRef } from 'react'

import type { SelectMods } from '@infrastructure'

import type { Entry } from '@domain'

import { partitionEntries } from '../helpers'

export function useGrid(
  data: Entry[] | undefined,
  onSelect: (name: string, mods: SelectMods) => void,
  onOpen: (item: Entry) => void,
) {
  const { folders, files } = useMemo(() => partitionEntries(data), [data])

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  const handleSelect = useCallback((entry: Entry, event: MouseEvent) => {
    event.stopPropagation()
    onSelectRef.current(entry.name, {
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    })
  }, [])

  const handleOpen = useCallback((entry: Entry) => {
    onOpenRef.current(entry)
  }, [])

  return { folders, files, handleSelect, handleOpen }
}
