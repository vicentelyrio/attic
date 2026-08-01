import { useI18nContext } from '@i18n'

import { Group, Text } from '@mantine/core'

export function Logo() {
  const { LL } = useI18nContext()

  return (
    <Group gap="xs" wrap="nowrap" justify="space-between" py="xs">
      <Text fw={600} size="lg">
        {LL.app.name()}
      </Text>
      <Text size="xs" c="dimmed">
        v0.1.3
      </Text>
    </Group>
  )
}
