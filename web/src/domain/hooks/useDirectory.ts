import { useQuery } from '@tanstack/react-query'

import { listDir } from '@domain'

export function useDirectory(root: string | null, path: string) {
  return useQuery({
    queryKey: ['list', root, path],
    queryFn: () => listDir(root as string, path),
    enabled: root !== null,
  })
}
