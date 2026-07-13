import { type MouseEvent, useMemo, useState } from 'react'

import type { SelectMods } from '@infrastructure'

import type { Entry } from '@domain'

import type { Target } from '../helpers'

export function useContextMenuTarget(
  entries: Entry[],
  selected: Set<string>,
  onSelect: (name: string, mods: SelectMods) => void,
) {
  const [target, setTarget] = useState<Target>(null)

  const open = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest('[data-name]')
    const name = el?.getAttribute('data-name')

    if (!name) {
      setTarget({ kind: 'empty' })
      return
    }

    const names = selected.has(name) ? selected : new Set([name])
    if (!selected.has(name)) onSelect(name, { shift: false, toggle: false })

    setTarget({
      kind: 'entries',
      entries: entries.filter((e) => names.has(e.name)),
    })
  }

  const list = target?.kind === 'entries' ? target.entries : []
  const single = list.length === 1 ? list[0] : null

  const selectedEntries = useMemo(
    () => entries.filter((e) => selected.has(e.name)),
    [entries, selected],
  )

  return {
    target,
    close: () => setTarget(null),
    open,
    list,
    single,
    selectedEntries,
  }
}
