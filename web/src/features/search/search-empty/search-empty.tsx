import { useI18nContext } from '@i18n'

import { Text } from '@mantine/core'
import { Spotlight } from '@mantine/spotlight'

import { MagnifyingGlassIcon } from '@phosphor-icons/react'

import classes from './search-empty.module.css'

export function SearchEmpty({ term }: { term: string }) {
  const { LL } = useI18nContext()

  return (
    <Spotlight.Empty>
      <div className={classes.noResults}>
        <MagnifyingGlassIcon size={44} className={classes.noResultsIcon} />
        <Text size="md" fw={600}>
          {LL.search.noResults({ term })}
        </Text>
        <Text size="sm" c="dimmed">
          {LL.search.noResultsHint()}
        </Text>
      </div>
    </Spotlight.Empty>
  )
}
