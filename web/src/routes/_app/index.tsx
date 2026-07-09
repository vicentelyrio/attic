import { createFileRoute, redirect } from '@tanstack/react-router'

import { Stack, Text } from '@mantine/core'

import { fetchRoots } from '@domain'

export const Route = createFileRoute('/_app/')({
  loader: async () => {
    const [first] = await fetchRoots()
    if (!first) return
    throw redirect({
      to: '/$root/$',
      params: { root: first.name, _splat: '' },
    })
  },
  component: NoDrives,
})

function NoDrives() {
  return (
    <Stack gap={4} p="md">
      <Text fw={600}>No drives</Text>
      <Text size="sm" c="dimmed">
        Add a directory or symlink under the server's roots_dir, then restart.
      </Text>
    </Stack>
  )
}
