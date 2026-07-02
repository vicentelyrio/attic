import { useState } from 'react'

export type SelectMods = { shift: boolean; toggle: boolean }

type State = { key: string; names: Set<string>; anchor: string | null }

export function useSelection(dirKey: string, order: string[]) {
  const [sel, setSel] = useState<State>({
    key: dirKey,
    names: new Set(),
    anchor: null,
  })

  const selected = sel.key === dirKey ? sel.names : new Set<string>()

  const onSelect = (name: string, mods: SelectMods) => {
    setSel((prev) => {
      const base: State =
        prev.key === dirKey
          ? prev
          : { key: dirKey, names: new Set(), anchor: null }

      if (mods.shift && base.anchor) {
        const a = order.indexOf(base.anchor)
        const b = order.indexOf(name)
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a]
          return {
            key: dirKey,
            names: new Set(order.slice(lo, hi + 1)),
            anchor: base.anchor,
          }
        }
      }

      if (mods.toggle) {
        const names = new Set(base.names)
        if (names.has(name)) names.delete(name)
        else names.add(name)
        return { key: dirKey, names, anchor: name }
      }

      return { key: dirKey, names: new Set([name]), anchor: name }
    })
  }

  const clear = () => setSel({ key: dirKey, names: new Set(), anchor: null })

  return { selected, onSelect, clear }
}
