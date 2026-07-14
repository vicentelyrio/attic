import { useShortcut } from '@infrastructure'

import { Input, Kbd } from '@mantine/core'
import { spotlight } from '@mantine/spotlight'

import { MagnifyingGlassIcon } from '@phosphor-icons/react'

import classes from './search-trigger.module.css'

export function SearchTrigger() {
  return (
    <Input
      component="button"
      type="button"
      pointer
      className={classes.trigger}
      leftSection={<MagnifyingGlassIcon />}
      rightSection={<Kbd className={classes.kbd}>{useShortcut('search')}</Kbd>}
      rightSectionWidth={64}
      onClick={spotlight.open}
    >
      Search
    </Input>
  )
}
