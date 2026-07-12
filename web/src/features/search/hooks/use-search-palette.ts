import { useParams } from '@tanstack/react-router'

import { useRoots } from '@domain'

import { useQuickActions } from './use-quick-actions'
import { useSearchQuery } from './use-search-query'
import { useSearchResults } from './use-search-results'

export function useSearchPalette() {
  const params = useParams({ strict: false })
  const { data: roots } = useRoots()
  const root = params.root ?? roots?.[0]?.name ?? null
  const path = params._splat ?? ''

  const query = useSearchQuery()
  const results = useSearchResults(query.debounced, query.isCommand)
  const quick = useQuickActions(root ?? '', path, query.isCommand, query.term)

  const empty = query.query.trim().length === 0
  const searching = !query.isCommand && query.debounced.trim().length > 0

  const showActions = query.isCommand || empty
  const showRecent = empty && results.recent.length > 0
  const showFiles = searching && results.hits.length > 0
  const showEmpty =
    searching && !results.isFetching && results.hits.length === 0
  const showLoader =
    searching && results.isFetching && results.hits.length === 0

  return {
    ...query,
    ...results,
    ...quick,
    showActions,
    showRecent,
    showFiles,
    showEmpty,
    showLoader,
  }
}

export type SearchState = ReturnType<typeof useSearchPalette>
