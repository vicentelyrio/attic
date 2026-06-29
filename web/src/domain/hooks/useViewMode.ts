import { useLocalStorage } from '@mantine/hooks'

export type ViewMode = 'list' | 'grid'

/**
 * Persisted list/grid preference. Backed by localStorage so the choice
 * survives reloads and applies across folders, like a native file browser.
 * Read synchronously to avoid a flash of the default view on mount.
 */
export function useViewMode() {
  return useLocalStorage<ViewMode>({
    key: 'files:view',
    defaultValue: 'list',
    getInitialValueInEffect: false,
  })
}
