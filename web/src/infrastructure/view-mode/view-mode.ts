import { useLocalStorage } from '@mantine/hooks'

export type ViewMode = 'list' | 'grid'

export function useViewMode() {
  return useLocalStorage<ViewMode>({
    key: 'files:view',
    defaultValue: 'list',
    getInitialValueInEffect: false,
  })
}
