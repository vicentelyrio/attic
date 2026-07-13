import { Group } from '@mantine/core'
import { Spotlight } from '@mantine/spotlight'

import { MagnifyingGlassIcon } from '@phosphor-icons/react'

import { NewEntryDialog } from '../files/context-menu/new-entry-dialog'
import { EntryRow } from './entry-row'
import { useSearchPalette } from './hooks'
import { QuickAction } from './quick-action'
import classes from './search.module.css'
import { SearchEmpty } from './search-empty'
import { SearchHint } from './search-hint'
import { SearchLoading } from './search-loading'
import { SearchTrigger } from './search-trigger'

export function Search() {
  const s = useSearchPalette()

  return (
    <>
      <SearchTrigger />

      <input
        ref={s.inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => s.pickFiles(e.currentTarget.files)}
      />

      <NewEntryDialog
        kind={s.newEntry}
        pending={s.creating}
        onSubmit={s.createEntry}
        onClose={s.closeNew}
      />

      <Spotlight.Root
        query={s.query}
        onQueryChange={s.setQuery}
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
          {s.showActions && (
            <Spotlight.ActionsGroup label="Quick actions">
              {s.actions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </Spotlight.ActionsGroup>
          )}

          {s.showLoader && <SearchLoading />}

          {s.showFiles && (
            <Spotlight.ActionsGroup
              label={`Files · ${s.hits.length} ${s.hits.length === 1 ? 'match' : 'matches'}`}
            >
              {s.hits.map((hit) => (
                <Spotlight.Action
                  key={`${hit.root}/${hit.path}`}
                  onClick={() => s.reveal(hit)}
                >
                  <EntryRow hit={hit} />
                </Spotlight.Action>
              ))}
            </Spotlight.ActionsGroup>
          )}

          {s.showRecent && (
            <Spotlight.ActionsGroup label="Recent">
              {s.recent.map((hit) => (
                <Spotlight.Action
                  key={`${hit.root}/${hit.path}`}
                  onClick={() => s.openFolder(hit)}
                >
                  <EntryRow hit={hit} />
                </Spotlight.Action>
              ))}
            </Spotlight.ActionsGroup>
          )}

          {s.showEmpty && <SearchEmpty term={s.debounced.trim()} />}
        </Spotlight.ActionsList>

        <Spotlight.Footer>
          <Group gap="lg" wrap="nowrap">
            <SearchHint keys={['↑', '↓']} label="navigate" />
            <SearchHint keys={['↵']} label="open" />
            <SearchHint keys={['/']} label="actions" />
            <SearchHint keys={['esc']} label="close" />
          </Group>
        </Spotlight.Footer>
      </Spotlight.Root>
    </>
  )
}
