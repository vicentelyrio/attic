import { Group, Paper, Progress, Stack, Text } from '@mantine/core'

import { useRoots } from '@domain'
import { size } from '@infrastructure'


export function Storage() {
  const { data: roots = [] } = useRoots()

  const totalBytes = roots.reduce((acc, r) => acc + r.total, 0)
  const usedBytes = roots.reduce((acc, r) => acc + r.used, 0)
  const storagePercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0

  return (
    <Paper shadow="md" p="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm">Storage</Text>
          <Text size="sm" c="dimmed">{storagePercent}%</Text>
        </Group>
        <Progress value={storagePercent} size="sm" />
        <Text size="xs" c="dimmed">
          {size(usedBytes)} of {size(totalBytes)} used
        </Text>
      </Stack>
    </Paper>
  )
}
