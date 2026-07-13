import { Group, Loader, Text } from '@mantine/core'

export function SearchLoading() {
  return (
    <Group justify="center" py="lg" gap="sm">
      <Loader size="sm" type="oval" />
      <Text size="sm" c="dimmed">
        Searching…
      </Text>
    </Group>
  )
}
