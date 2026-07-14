import { useMemo } from 'react'

import {
  useDetailPanel,
  useFullscreenPreview,
  useSelection,
  useShowHidden,
  useViewMode,
} from '@infrastructure'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Flex, Stack } from '@mantine/core'

import { type Entry, useClipboardShortcuts, useDirectory } from '@domain'

import {
  ContextMenu,
  DetailPanel,
  FilePreview,
  Footer,
  Grid,
  Header,
  List,
  useRename,
} from '@features'

export const Route = createFileRoute('/_app/$root/$')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const { root, _splat } = Route.useParams()
  const path = _splat ?? ''

  const { data } = useDirectory(root, path)
  const [view, setView] = useViewMode()
  const [showHidden, setShowHidden] = useShowHidden()

  const all = data?.entries

  const entries = useMemo(
    () =>
      showHidden ? all : all?.filter((entry) => !entry.name.startsWith('.')),
    [all, showHidden],
  )

  const hiddenCount = useMemo(
    () => all?.filter((entry) => entry.name.startsWith('.')).length ?? 0,
    [all],
  )

  const dirKey = path ? `${root}/${path}` : root
  const order = useMemo(() => entries?.map((e) => e.name) ?? [], [entries])
  const { selected, onSelect, clear } = useSelection(dirKey, order)

  useClipboardShortcuts(
    root,
    path,
    useMemo(() => [...selected], [selected]),
  )

  const preview = useFullscreenPreview(selected, entries)
  const detail = useDetailPanel(selected, entries, !!preview.entry)
  const rename = useRename(root, path)

  const open = (item: Entry) => {
    if (!item.is_dir) return
    navigate({
      to: '/$root/$',
      params: { root, _splat: path ? `${path}/${item.name}` : item.name },
    })
  }

  return (
    <Flex flex={1} mih={0}>
      <Stack flex={1} mih={0}>
        <Header root={root} path={path} view={view} onViewChange={setView} />
        <ContextMenu
          entries={entries ?? []}
          root={root}
          path={path}
          writable={data?.writable ?? false}
          selected={selected}
          onSelect={onSelect}
          onOpen={open}
          onQuickLook={detail.open}
          onPreview={preview.open}
          onRename={rename.begin}
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
              rename={rename}
            />
          ) : (
            <List
              data={entries}
              onOpen={open}
              selected={selected}
              onSelect={onSelect}
              onClearSelection={clear}
              rename={rename}
            />
          )}
        </ContextMenu>
        <Footer
          root={root}
          path={path}
          count={all?.length ?? 0}
          hidden={hiddenCount}
          showHidden={showHidden}
          onShowHiddenChange={setShowHidden}
        />
      </Stack>
      {detail.entry && (
        <DetailPanel
          entry={detail.entry}
          root={root}
          path={path}
          onClose={detail.close}
        />
      )}
      {preview.entry && (
        <FilePreview
          entry={preview.entry}
          root={root}
          path={path}
          index={preview.index}
          total={preview.total}
          onPrev={preview.prev}
          onNext={preview.next}
          onClose={preview.close}
        />
      )}
    </Flex>
  )
}
