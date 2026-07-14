import { Text } from '@mantine/core'
import { Spotlight } from '@mantine/spotlight'

import { MagnifyingGlassIcon } from '@phosphor-icons/react'

import classes from './search-empty.module.css'

export function SearchEmpty({ term }: { term: string }) {
  return (
    <Spotlight.Empty>
      <div className={classes.noResults}>
        <MagnifyingGlassIcon size={44} className={classes.noResultsIcon} />
        <Text size="md" fw={600}>
          No results for “{term}”
        </Text>
        <Text size="sm" c="dimmed">
          Try a different name or check the spelling.
        </Text>
      </div>
    </Spotlight.Empty>
  )
}
