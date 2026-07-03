import { useQuery } from '@tanstack/react-query'

import { listDir } from '@domain'

const REFETCH_MS = 5000

export function useDirectory(root: string | null, path: string) {
  return useQuery({
    queryKey: ['list', root, path],
    queryFn: () => listDir(root as string, path),
    enabled: root !== null,
    refetchInterval: REFETCH_MS,
  })
}
