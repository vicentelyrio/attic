import { Group, Stack, Text } from '@mantine/core'

import { Drivers, Profile, Search, Storage } from '@features'

import classes from './sidebar.module.css'

export function Sidebar() {
  return (
    <Stack className={classes.sidebar}>
      <Stack gap="xl">
        <Group className={classes.header} gap="xs" wrap="nowrap">
          <div className={classes.logo}>V</div>
          <Text fw={600} size="sm" style={{ flex: 1 }}>
            Vault
          </Text>
          <Text className={classes.version}>v0.9</Text>
        </Group>
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
