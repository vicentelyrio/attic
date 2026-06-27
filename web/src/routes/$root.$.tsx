import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DataList, Stack } from '@mantine/core'

import { useDirectory, type Entry } from '@domain'
import { Breadcrumbs } from '@components/breadcrumbs/breadcrumbs'

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
      <DataList>
        {data?.map((item) => (
          <DataList.Item key={item.name} onClick={() => open(item)}>
            <DataList.ItemLabel>{item.name}</DataList.ItemLabel>
            <DataList.ItemValue>{item.size}</DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList>
    </Stack>
  )
}
