import { Stack } from '@mantine/core'

import { Drivers, Logo, Profile, Search, Storage } from '@features'

import classes from './sidebar.module.css'

export function Sidebar() {
  return (
    <Stack className={classes.sidebar}>
      <Stack gap="xl">
        <Logo />
        <Search />
        <Drivers />
        <Storage />
      </Stack>

      <Stack>
        <Profile />
      </Stack>
    </Stack>
  )
}
