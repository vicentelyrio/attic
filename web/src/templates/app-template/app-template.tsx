import { Outlet } from '@tanstack/react-router'
import { Box, Stack } from '@mantine/core'

import classes from './app-template.module.css'

export function AppTemplate() {
  return (
    <Box className={classes.container}>
      <Stack className={classes.sidebar}>
        Sidebar
      </Stack>
      <Stack className={classes.workspace}>
        <Outlet />
      </Stack>
    </Box>
  )
}
