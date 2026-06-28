import { Avatar, Group, Stack, Text } from '@mantine/core'

export function Profile() {
  return (
    <Group gap="xs" wrap="nowrap">
      <Avatar size="sm" radius="sm" color="orange">HK</Avatar>
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} truncate>homelab</Text>
        <Text size="xs" truncate>admin · localhost</Text>
      </Stack>
    </Group>
  )
}
