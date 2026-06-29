import { Group, Text } from '@mantine/core'

export function Logo() {
  return (
    <Group gap="xs" wrap="nowrap" justify="space-between">
      <Text fw={600} size="lg">Attic</Text>
      <Text size="xs" c="dimmed">v0.9</Text>
    </Group>
  )
}
