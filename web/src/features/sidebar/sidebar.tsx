import { useParams } from '@tanstack/react-router'

import { Stack } from '@mantine/core'

import { useRoots } from '@domain'

import {
  Drivers,
  Favorites,
  Logo,
  Profile,
  Search,
  Storage,
  Transfers,
  Uploads,
} from '@features'

import classes from './sidebar.module.css'

export function Sidebar() {
  const params = useParams({ strict: false })
  const { data: roots } = useRoots()
  const root = params.root ?? roots?.[0]?.name ?? ''
  const path = params._splat ?? ''

  return (
    <Stack className={classes.sidebar}>
      <Stack gap="xl">
        <Logo />
        <Search />
        <Uploads root={root} path={path} />
        <Favorites />
        <Drivers />
      </Stack>

      <Stack gap="md">
        <Transfers />
        <Storage />
        <Profile />
      </Stack>
    </Stack>
  )
}
