import { Outlet } from '@tanstack/react-router'

import { Box, Stack } from '@mantine/core'

import { EntryDndProvider, Sidebar } from '@features'

import classes from './app-template.module.css'

export function AppTemplate() {
  return (
    <EntryDndProvider>
      <Box className={classes.container}>
        <div className={classes.sidebar}>
          <Sidebar />
        </div>
        <Stack className={classes.workspace}>
          <Outlet />
        </Stack>
      </Box>
    </EntryDndProvider>
  )
}
