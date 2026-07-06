import { type ReactNode, useRef, useState } from 'react'

import { useNavigate, useParams } from '@tanstack/react-router'

import { Group, Input, Kbd, Loader, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Spotlight, spotlight } from '@mantine/spotlight'

import {
  ArrowElbowDownLeftIcon,
  FilePlusIcon,
  FolderPlusIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react'

import {
  type RecentEntry,
  type SearchHit,
  useFileOps,
  useRecent,
  useRoots,
  useSearch,
  useUploads,
} from '@domain'

import { EntryIcon } from '@features'

import {
  NewEntryDialog,
  type NewEntryKind,
} from '../files/context-menu/new-entry-dialog'
import classes from './search.module.css'

const HEAD = 2
const TAIL = 2

function crumb(hit: RecentEntry): string {
  const segments = hit.parent ? hit.parent.split('/').filter(Boolean) : []
  const parts = [hit.root, ...segments]

  if (parts.length <= HEAD + TAIL + 1) return parts.join('/')

  return [...parts.slice(0, HEAD), '…', ...parts.slice(-TAIL)].join('/')
}

function Hint({ keys, label }: { keys: ReactNode[]; label: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <span className={classes.hintKeys}>
        {keys.map((k, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static, order-stable
          <Kbd key={i}>{k}</Kbd>
        ))}
      </span>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  )
}

function EntryRow({ hit }: { hit: RecentEntry }) {
  return (
    <Group gap="sm" wrap="nowrap" className={classes.row}>
      <EntryIcon name={hit.name} isDir={hit.is_dir} size={30} />
      <div className={classes.meta}>
        <Text size="sm" fw={600} truncate>
          {hit.name}
        </Text>
        <Text size="xs" c="dimmed" ff="monospace" truncate>
          {crumb(hit)}
        </Text>
      </div>
      <span className={classes.openHint}>
        <ArrowElbowDownLeftIcon />
        open
      </span>
    </Group>
  )
}

type ActionDef = {
  icon: ReactNode
  label: string
  onClick: () => void
}

function QuickAction({ icon, label, onClick }: ActionDef) {
  return (
    <Spotlight.Action onClick={onClick}>
      <Group gap="sm" wrap="nowrap" className={classes.row}>
        <span className={classes.actionIcon}>{icon}</span>
        <Text size="sm" fw={500}>
          {label}
        </Text>
      </Group>
    </Spotlight.Action>
  )
}

export function Search() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const { data: roots } = useRoots()
  const root = params.root ?? roots?.[0]?.name ?? null
  const path = params._splat ?? ''

  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query, 180)
  const [newEntry, setNewEntry] = useState<NewEntryKind | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const isCommand = query.trimStart().startsWith('/')
  const term = isCommand ? query.trimStart().slice(1).trim().toLowerCase() : ''

  const { data, isFetching } = useSearch(isCommand ? '' : debounced, null)
  const hits = data ?? []
  const { items: recent, push } = useRecent()
  const fileOps = useFileOps(root ?? '', path)
  const uploads = useUploads(root ?? '', path)

  const reveal = (hit: SearchHit) => {
    push(hit)
    spotlight.close()
    navigate({
      to: '/$root/$',
      params: { root: hit.root, _splat: hit.is_dir ? hit.path : hit.parent },
    })
  }

  const openFolder = (hit: RecentEntry) => {
    spotlight.close()
    navigate({
      to: '/$root/$',
      params: { root: hit.root, _splat: hit.is_dir ? hit.path : hit.parent },
    })
  }

  const pickFiles = (list: FileList | null) => {
    const files = list ? Array.from(list) : []
    if (files.length) uploads.add(files)
    if (inputRef.current) inputRef.current.value = ''
    spotlight.close()
  }

  const createEntry = (name: string) => {
    const op = newEntry === 'folder' ? fileOps.mkdir : fileOps.touch
    op.mutate(name, {
      onSuccess: () => {
        setNewEntry(null)
        spotlight.close()
      },
    })
  }

  const actions: ActionDef[] = [
    {
      icon: <FilePlusIcon />,
      label: 'New file',
      onClick: () => setNewEntry('file'),
    },
    {
      icon: <FolderPlusIcon weight="fill" />,
      label: 'New folder',
      onClick: () => setNewEntry('folder'),
    },
    {
      icon: <UploadSimpleIcon />,
      label: 'Upload…',
      onClick: () => inputRef.current?.click(),
    },
  ]

  const shownActions = isCommand
    ? actions.filter((a) => a.label.toLowerCase().includes(term))
    : actions

  const empty = query.trim().length === 0
  const searching = !isCommand && debounced.trim().length > 0
  const showActions = isCommand || empty
  const showRecent = empty && recent.length > 0
  const showFiles = searching && hits.length > 0
  const showEmpty = searching && !isFetching && hits.length === 0
  const showLoader = searching && isFetching && hits.length === 0
  const creating =
    newEntry === 'folder' ? fileOps.mkdir.isPending : fileOps.touch.isPending

  return (
    <>
      <Input
        component="button"
        type="button"
        pointer
        className={classes.trigger}
        leftSection={<MagnifyingGlassIcon />}
        rightSection={<Kbd>⌘K</Kbd>}
        rightSectionWidth={48}
        onClick={spotlight.open}
      >
        Search
      </Input>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => pickFiles(e.currentTarget.files)}
      />

      <NewEntryDialog
        kind={newEntry}
        pending={creating}
        onSubmit={createEntry}
        onClose={() => setNewEntry(null)}
      />

      <Spotlight.Root
        query={query}
        onQueryChange={setQuery}
        size={720}
        radius="lg"
        classNames={{
          search: classes.search,
          actionsList: classes.list,
          actionsGroup: classes.group,
          action: classes.action,
          empty: classes.empty,
          footer: classes.footer,
        }}
      >
        <Spotlight.Search
          placeholder="Search files, or type / for actions…"
          leftSection={<MagnifyingGlassIcon size={22} />}
        />

        <Spotlight.ActionsList>
          {showActions && (
            <Spotlight.ActionsGroup label="Quick actions">
              {shownActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </Spotlight.ActionsGroup>
          )}

          {showLoader && (
            <Group justify="center" py="lg" gap="sm">
              <Loader size="sm" type="oval" />
              <Text size="sm" c="dimmed">
                Searching…
              </Text>
            </Group>
          )}

          {showFiles && (
            <Spotlight.ActionsGroup
              label={`Files · ${hits.length} ${hits.length === 1 ? 'match' : 'matches'}`}
            >
              {hits.map((hit) => (
                <Spotlight.Action
                  key={`${hit.root}/${hit.path}`}
                  onClick={() => reveal(hit)}
                >
                  <EntryRow hit={hit} />
                </Spotlight.Action>
              ))}
            </Spotlight.ActionsGroup>
          )}

          {showRecent && (
            <Spotlight.ActionsGroup label="Recent">
              {recent.map((hit) => (
                <Spotlight.Action
                  key={`${hit.root}/${hit.path}`}
                  onClick={() => openFolder(hit)}
                >
                  <EntryRow hit={hit} />
                </Spotlight.Action>
              ))}
            </Spotlight.ActionsGroup>
          )}

          {showEmpty && (
            <Spotlight.Empty>
              <div className={classes.noResults}>
                <MagnifyingGlassIcon
                  size={44}
                  className={classes.noResultsIcon}
                />
                <Text size="md" fw={600}>
                  No results for “{debounced.trim()}”
                </Text>
                <Text size="sm" c="dimmed">
                  Try a different name or check the spelling.
                </Text>
              </div>
            </Spotlight.Empty>
          )}
        </Spotlight.ActionsList>

        <Spotlight.Footer>
          <Group gap="lg" wrap="nowrap">
            <Hint keys={['↑', '↓']} label="navigate" />
            <Hint keys={['↵']} label="open" />
            <Hint keys={['/']} label="actions" />
            <Hint keys={['esc']} label="close" />
          </Group>
        </Spotlight.Footer>
      </Spotlight.Root>
    </>
  )
}
