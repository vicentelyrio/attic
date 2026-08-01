import { useI18nContext } from '@i18n'

import { Group, Loader, Text } from '@mantine/core'

export function SearchLoading() {
  const { LL } = useI18nContext()

  return (
    <Group justify="center" py="lg" gap="sm">
      <Loader size="sm" type="oval" />
      <Text size="sm" c="dimmed">
        {LL.search.searching()}
      </Text>
    </Group>
  )
}
