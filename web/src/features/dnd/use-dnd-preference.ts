import { useLocalStorage } from '@mantine/hooks'

/** Whether drag-and-drop moves ask for confirmation first. Persisted so a
 *  "don't ask again" opt-out sticks across sessions. */
export function useDndConfirmPreference() {
  return useLocalStorage<boolean>({
    key: 'dnd:confirmMoves',
    defaultValue: true,
    getInitialValueInEffect: false,
  })
}
