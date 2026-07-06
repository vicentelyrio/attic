import { useCallback } from 'react'

import { useLocalStorage } from '@mantine/hooks'

import type { SearchHit } from '@domain'

export type RecentEntry = Pick<
  SearchHit,
  'root' | 'path' | 'name' | 'parent' | 'is_dir'
>

const LIMIT = 6

export function useRecent() {
  const [items, setItems] = useLocalStorage<RecentEntry[]>({
    key: 'files:recent',
    defaultValue: [],
    getInitialValueInEffect: false,
  })

  const push = useCallback(
    (hit: RecentEntry) => {
      const entry: RecentEntry = {
        root: hit.root,
        path: hit.path,
        name: hit.name,
        parent: hit.parent,
        is_dir: hit.is_dir,
      }
      setItems((prev) => {
        const rest = prev.filter(
          (it) => !(it.root === entry.root && it.path === entry.path),
        )
        return [entry, ...rest].slice(0, LIMIT)
      })
    },
    [setItems],
  )

  return { items, push }
}
