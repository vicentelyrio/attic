import { Stack } from '@mantine/core'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  type Entry,
  useDirectory,
  useSelection,
  useShowHidden,
  useViewMode,
} from '@domain'
import { ClipboardActions, Grid, Header, List } from '@features'

export const Route = createFileRoute('/$root/$')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const { root, _splat } = Route.useParams()
  const path = _splat ?? ''

  const { data } = useDirectory(root, path)
  const [view, setView] = useViewMode()
  const [showHidden, setShowHidden] = useShowHidden()

  const entries = useMemo(
    () =>
      showHidden ? data : data?.filter((entry) => !entry.name.startsWith('.')),
    [data, showHidden],
  )

  const dirKey = path ? `${root}/${path}` : root
  const order = useMemo(() => entries?.map((e) => e.name) ?? [], [entries])
  const { selected, onSelect, clear } = useSelection(dirKey, order)

  const open = (item: Entry) => {
    if (!item.is_dir) return
    navigate({
      to: '/$root/$',
      params: { root, _splat: path ? `${path}/${item.name}` : item.name },
    })
  }

  return (
    <Stack flex={1} mih={0}>
      <Header
        root={root}
        path={path}
        view={view}
        onViewChange={setView}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        actions={
          <ClipboardActions root={root} path={path} selected={[...selected]} />
        }
      />
      {view === 'grid' ? (
        <Grid
          data={entries}
          root={root}
          path={path}
          onOpen={open}
          selected={selected}
          onSelect={onSelect}
          onClearSelection={clear}
        />
      ) : (
        <List
          data={entries}
          onOpen={open}
          selected={selected}
          onSelect={onSelect}
          onClearSelection={clear}
        />
      )}
    </Stack>
  )
}
