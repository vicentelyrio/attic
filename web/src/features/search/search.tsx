import { Kbd, TextInput } from '@mantine/core'

import { MagnifyingGlassIcon } from '@phosphor-icons/react'

export function Search() {
  return (
    <TextInput
      placeholder="Search"
      leftSection={<MagnifyingGlassIcon />}
      rightSection={<Kbd>⌘K</Kbd>}
    />
  )
}
