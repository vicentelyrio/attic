import { useQuery } from '@tanstack/react-query'

import { fetchTextPreview } from '@domain'

export function useFilePreview(root: string, path: string, enabled: boolean) {
  return useQuery({
    queryKey: ['preview', root, path],
    queryFn: () => fetchTextPreview(root, path),
    enabled,
    staleTime: Infinity,
    retry: false,
  })
}
