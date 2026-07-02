import { useLocalStorage } from '@mantine/hooks'

export function useShowHidden() {
  return useLocalStorage<boolean>({
    key: 'files:show-hidden',
    defaultValue: false,
    getInitialValueInEffect: false,
  })
}
