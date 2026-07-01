import { Box, Stack } from '@mantine/core'
import { Outlet } from '@tanstack/react-router'
import { Sidebar, Transfers } from '@features'
import classes from './app-template.module.css'

export function AppTemplate() {
  return (
    <Box className={classes.container}>
      <div className={classes.sidebar}>
        <Sidebar />
      </div>
      <Stack className={classes.workspace}>
        <Outlet />
      </Stack>
      <Transfers />
    </Box>
  )
}
