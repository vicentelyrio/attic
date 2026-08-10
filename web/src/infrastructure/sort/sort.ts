import { useLocalStorage } from '@mantine/hooks'

export type SortField = 'name' | 'size' | 'kind' | 'modified'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  field: SortField
  direction: SortDirection
}

const DEFAULT_SORT: SortState = { field: 'name', direction: 'asc' }

export function useSort() {
  return useLocalStorage<SortState>({
    key: 'files:sort',
    defaultValue: DEFAULT_SORT,
    getInitialValueInEffect: false,
  })
}

/** Clicking the active field flips direction; clicking a new field resets to ascending. */
export function toggleSortField(
  current: SortState,
  field: SortField,
): SortState {
  if (current.field !== field) return { field, direction: 'asc' }
  return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
}
