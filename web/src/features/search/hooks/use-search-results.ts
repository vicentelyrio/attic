import { useNavigate } from '@tanstack/react-router'

import { spotlight } from '@mantine/spotlight'

import { type RecentEntry, type SearchHit, useRecent, useSearch } from '@domain'

export function useSearchResults(debounced: string, isCommand: boolean) {
  const navigate = useNavigate()

  const { data, isFetching } = useSearch(isCommand ? '' : debounced, null)
  const hits = data ?? []
  const { items: recent, push } = useRecent()

  const reveal = (hit: SearchHit) => {
    push(hit)
    spotlight.close()
    navigate({
      to: '/$root/$',
      params: { root: hit.root, _splat: hit.is_dir ? hit.path : hit.parent },
    })
  }

  const openFolder = (hit: RecentEntry) => {
    spotlight.close()
    navigate({
      to: '/$root/$',
      params: { root: hit.root, _splat: hit.is_dir ? hit.path : hit.parent },
    })
  }

  return { hits, isFetching, recent, reveal, openFolder }
}
