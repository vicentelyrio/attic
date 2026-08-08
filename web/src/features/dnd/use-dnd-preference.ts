import { useLocalStorage } from '@mantine/hooks'

export function useDndConfirmPreference() {
  return useLocalStorage<boolean>({
    key: 'dnd:confirmMoves',
    defaultValue: true,
    getInitialValueInEffect: false,
  })
}
