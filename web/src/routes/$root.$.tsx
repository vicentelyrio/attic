import {
  useDetailPanel,
  useSelection,
  useShowHidden,
  useViewMode,
} from '@infrastructure'
import { Flex, Stack } from '@mantine/core'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { type Entry, useDirectory } from '@domain'
import {
  ClipboardActions,
  ContextMenu,
  DetailPanel,
  Grid,
  Header,
  List,
} from '@features'

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

  const detail = useDetailPanel(selected, entries)

  const [menuEntry, setMenuEntry] = useState<Entry | null>(null)

  const open = (item: Entry) => {
    if (!item.is_dir) return
    navigate({
      to: '/$root/$',
      params: { root, _splat: path ? `${path}/${item.name}` : item.name },
    })
  }

  const onContextEntry = (item: Entry) => {
    onSelect(item.name, { shift: false, toggle: false })
    setMenuEntry(item)
  }

  return (
    <Flex flex={1} mih={0}>
      <Stack flex={1} mih={0}>
        <Header
          root={root}
          path={path}
          view={view}
          onViewChange={setView}
          showHidden={showHidden}
          onShowHiddenChange={setShowHidden}
          actions={
            <ClipboardActions
              root={root}
              path={path}
              selected={[...selected]}
            />
          }
        />
        <ContextMenu
          entry={menuEntry}
          root={root}
          path={path}
          onOpen={open}
          onGetInfo={detail.open}
          onClose={() => setMenuEntry(null)}
        >
          {view === 'grid' ? (
            <Grid
              data={entries}
              root={root}
              path={path}
              onOpen={open}
              selected={selected}
              onSelect={onSelect}
              onClearSelection={clear}
              onContextEntry={onContextEntry}
            />
          ) : (
            <List
              data={entries}
              onOpen={open}
              selected={selected}
              onSelect={onSelect}
              onClearSelection={clear}
              onContextEntry={onContextEntry}
            />
          )}
        </ContextMenu>
      </Stack>
      {detail.entry && (
        <DetailPanel
          entry={detail.entry}
          root={root}
          path={path}
          onClose={detail.close}
        />
      )}
    </Flex>
  )
}
