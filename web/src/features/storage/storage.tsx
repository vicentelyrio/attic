import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import { Group, Paper, Progress, Stack, Text } from '@mantine/core'

import { useRoots } from '@domain'

export function Storage() {
  const { LL } = useI18nContext()
  const { data: roots = [] } = useRoots()

  const totalBytes = roots.reduce((acc, r) => acc + r.total, 0)
  const usedBytes = roots.reduce((acc, r) => acc + r.used, 0)
  const storagePercent =
    totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0

  return (
    <Paper shadow="md" p="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm">{LL.sidebar.storage()}</Text>
          <Text size="sm" c="dimmed">
            {storagePercent}%
          </Text>
        </Group>
        <Progress value={storagePercent} size="sm" />
        <Text size="xs" c="dimmed">
          {LL.sidebar.storageUsed({
            used: size(usedBytes),
            total: size(totalBytes),
          })}
        </Text>
      </Stack>
    </Paper>
  )
}
