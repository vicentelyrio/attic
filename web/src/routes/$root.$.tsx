import { Stack } from '@mantine/core'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type Entry, useDirectory, useViewMode } from '@domain'
import { Grid, Header, List } from '@features'

export const Route = createFileRoute('/$root/$')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const { root, _splat } = Route.useParams()
  const path = _splat ?? ''

  const { data } = useDirectory(root, path)
  const [view, setView] = useViewMode()

  const open = (item: Entry) => {
    if (!item.is_dir) return
    navigate({
      to: '/$root/$',
      params: { root, _splat: path ? `${path}/${item.name}` : item.name },
    })
  }

  return (
    <Stack flex={1} mih={0}>
      <Header root={root} path={path} view={view} onViewChange={setView} />
      {view === 'grid' ? (
        <Grid data={data} root={root} path={path} onOpen={open} />
      ) : (
        <List data={data} onOpen={open} />
      )}
    </Stack>
  )
}
