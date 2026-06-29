import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Center, Group, SegmentedControl, Stack } from '@mantine/core'
import { ListIcon, SquaresFourIcon } from '@phosphor-icons/react'

import { type Entry, useDirectory } from '@domain'
import { Breadcrumbs, List } from '@features'

export const Route = createFileRoute('/$root/$')({
  component: Index,
})

const viewmode = [
  {
    label: (
      <Center>
        <ListIcon />
      </Center>
    ),
    value: 'list',
  },
  {
    label: (
      <Center>
        <SquaresFourIcon />
      </Center>
    ),
    value: 'grid',
  },
]

function Index() {
  const navigate = useNavigate()
  const { root, _splat } = Route.useParams()
  const path = _splat ?? ''

  const { data } = useDirectory(root, path)

  const open = (item: Entry) => {
    if (!item.is_dir) return
    navigate({
      to: '/$root/$',
      params: { root, _splat: path ? `${path}/${item.name}` : item.name },
    })
  }

  return (
    <Stack flex={1} mih={0}>
      <Group gap="md" justify="space-between" p="md">
        <Breadcrumbs root={root} path={path} />
        <SegmentedControl data={viewmode} size="lg" />
      </Group>
      <List data={data} onOpen={open} />
    </Stack>
  )
}
