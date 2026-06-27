import { useQuery } from '@tanstack/react-query'
import { fetchRoots } from '@domain'

export function useRoots() {
  return useQuery({ queryKey: ['roots'], queryFn: fetchRoots })
}
