import { Input, Kbd } from '@mantine/core'
import { spotlight } from '@mantine/spotlight'

import { MagnifyingGlassIcon } from '@phosphor-icons/react'

import classes from '../search.module.css'

export function SearchTrigger() {
  return (
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
  )
}
