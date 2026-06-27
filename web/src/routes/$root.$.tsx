import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Stack } from '@mantine/core'

import { useDirectory, type Entry } from '@domain'
import { Breadcrumbs, List } from '@components'

export const Route = createFileRoute('/$root/$')({
  component: Index,
})

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
    <Stack>
      <Breadcrumbs root={root} path={path} />
      <List data={data as Entry[]} onOpen={open} />
    </Stack>
  )
}
