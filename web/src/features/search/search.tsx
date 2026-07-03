import { type ReactNode, useState } from 'react'

import { useNavigate, useParams } from '@tanstack/react-router'

import {
  Group,
  Input,
  Kbd,
  Loader,
  SegmentedControl,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Spotlight, spotlight } from '@mantine/spotlight'

import {
  ArrowElbowDownLeftIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react'

import { type SearchHit, useRoots, useSearch } from '@domain'

import { EntryIcon } from '@features'

import classes from './search.module.css'

type Scope = 'root' | 'all'

/** Breadcrumb shown under a hit. In root scope the root is implied and hidden;
 *  in global scope it is prefixed so results across roots stay distinguishable. */
function crumb(hit: SearchHit, scope: Scope): string {
  const segments = hit.parent ? hit.parent.split('/') : []
  const parts = scope === 'all' ? [hit.root, ...segments] : segments
  return parts.length ? parts.join(' / ') : hit.root
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

export function Search() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const { data: roots } = useRoots()
  const currentRoot = params.root ?? roots?.[0]?.name ?? null

  const [scope, setScope] = useState<Scope>('root')
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query, 180)

  const scopeRoot = scope === 'root' ? currentRoot : null
  const { data, isFetching } = useSearch(debounced, scopeRoot)
  const hits = data ?? []

  const reveal = (hit: SearchHit) => {
    spotlight.close()
    navigate({
      to: '/$root/$',
      params: { root: hit.root, _splat: hit.is_dir ? hit.path : hit.parent },
    })
  }

  const searching = debounced.trim().length > 0
  const showEmpty = searching && !isFetching && hits.length === 0
  const showLoader = searching && isFetching && hits.length === 0

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

      <Spotlight.Root
        query={query}
        onQueryChange={setQuery}
        size={640}
        radius="lg"
        scrollable
        maxHeight={440}
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
          placeholder="Search files…"
          leftSection={<MagnifyingGlassIcon size={22} />}
          rightSection={<Kbd>esc</Kbd>}
        />

        <Spotlight.ActionsList>
          {showLoader && (
            <Group justify="center" py="xl" gap="sm">
              <Loader size="sm" type="oval" />
              <Text size="sm" c="dimmed">
                Searching…
              </Text>
            </Group>
          )}

          {hits.length > 0 && (
            <Spotlight.ActionsGroup
              label={`Files · ${hits.length} ${hits.length === 1 ? 'match' : 'matches'}`}
            >
              {hits.map((hit) => (
                <Spotlight.Action
                  key={`${hit.root}/${hit.path}`}
                  onClick={() => reveal(hit)}
                >
                  <Group gap="md" wrap="nowrap" className={classes.row}>
                    <EntryIcon name={hit.name} isDir={hit.is_dir} size={34} />
                    <div className={classes.meta}>
                      <Text size="md" fw={600} truncate>
                        {hit.name}
                      </Text>
                      <Text size="sm" c="dimmed" ff="monospace" truncate>
                        {crumb(hit, scope)}
                      </Text>
                    </div>
                    <span className={classes.openHint}>
                      <ArrowElbowDownLeftIcon />
                      open
                    </span>
                  </Group>
                </Spotlight.Action>
              ))}
            </Spotlight.ActionsGroup>
          )}

          {showEmpty && (
            <Spotlight.Empty>
              No files match “{debounced.trim()}”
            </Spotlight.Empty>
          )}

          {!searching && (
            <Spotlight.Empty>Type to search your files</Spotlight.Empty>
          )}
        </Spotlight.ActionsList>

        <Spotlight.Footer>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="lg" wrap="nowrap">
              <Hint keys={['↑', '↓']} label="navigate" />
              <Hint keys={['↵']} label="open" />
              <Hint keys={['esc']} label="close" />
            </Group>
            <Group gap="md" wrap="nowrap">
              <SegmentedControl
                size="xs"
                value={scope}
                onChange={(v) => setScope(v as Scope)}
                data={[
                  { label: 'This root', value: 'root' },
                  { label: 'All roots', value: 'all' },
                ]}
              />
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="sm" radius="sm" color="indigo" />
                <Text size="xs" c="dimmed" fw={600}>
                  Vault
                </Text>
              </Group>
            </Group>
          </Group>
        </Spotlight.Footer>
      </Spotlight.Root>
    </>
  )
}
