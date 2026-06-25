import { useQuery } from '@tanstack/react-query'
import { fetchRoots, listDir } from '../api/files'

export function useRoots() {
  return useQuery({ queryKey: ['roots'], queryFn: fetchRoots })
}

export function useDirectory(root: string | null, path: string) {
  return useQuery({
    queryKey: ['list', root, path],
    queryFn: () => listDir(root!, path),
    enabled: root !== null, // don't fetch until a root is selected
  })
}
