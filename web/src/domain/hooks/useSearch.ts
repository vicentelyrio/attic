import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { search } from '@domain'

export function useSearch(query: string, root: string | null) {
  const q = query.trim()
  return useQuery({
    queryKey: ['search', root, q],
    queryFn: () => search(q, root ? { root } : undefined),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  })
}
