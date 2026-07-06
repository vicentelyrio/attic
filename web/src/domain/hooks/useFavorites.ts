import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addFavorite,
  type Favorite,
  fetchFavorites,
  removeFavorite,
} from '@domain'

export function useFavorites() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['favorites'] })

  const query = useQuery({ queryKey: ['favorites'], queryFn: fetchFavorites })
  const items = query.data ?? []

  const add = useMutation({
    mutationFn: (ref: { root: string; path: string }) => addFavorite(ref),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: string) => removeFavorite(id),
    onSuccess: refresh,
  })

  const find = useCallback(
    (root: string, path: string): Favorite | undefined =>
      items.find((it) => it.root === root && it.path === path),
    [items],
  )

  return { items, add, remove, find }
}
