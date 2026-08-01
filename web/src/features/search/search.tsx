import { useI18nContext } from '@i18n'

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
  const { LL } = useI18nContext()
  const s = useSearchPalette()

  return (
    <>
      <SearchTrigger />

      <input
        ref={s.inputRef}
        type="file"
        multiple
        hidden
        onChange={s.onPicked}
      />

      <input
        ref={s.folderRef}
        type="file"
        multiple
        hidden
        webkitdirectory=""
        onChange={s.onPicked}
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
          placeholder={LL.search.placeholder()}
          leftSection={<MagnifyingGlassIcon size={22} />}
        />

        <Spotlight.ActionsList>
          {s.showActions && (
            <Spotlight.ActionsGroup label={LL.search.quickActions()}>
              {s.actions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </Spotlight.ActionsGroup>
          )}

          {s.showLoader && <SearchLoading />}

          {s.showFiles && (
            <Spotlight.ActionsGroup
              label={LL.search.matches({ count: s.hits.length })}
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
            <Spotlight.ActionsGroup label={LL.search.recent()}>
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
            <SearchHint keys={['↑', '↓']} label={LL.search.hints.navigate()} />
            <SearchHint keys={['↵']} label={LL.search.hints.open()} />
            <SearchHint keys={['/']} label={LL.search.hints.actions()} />
            <SearchHint keys={['esc']} label={LL.search.hints.close()} />
          </Group>
        </Spotlight.Footer>
      </Spotlight.Root>
    </>
  )
}
