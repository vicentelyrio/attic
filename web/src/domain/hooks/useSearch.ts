import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { search } from '@domain'

/** Debounced query is expected — pass the already-debounced value. When `root`
 *  is null the search runs globally across every root. */
export function useSearch(query: string, root: string | null) {
  const q = query.trim()
  return useQuery({
    queryKey: ['search', root, q],
    queryFn: () => search(q, root ? { root } : undefined),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  })
}
