import { Center, Group, SegmentedControl, Stack } from '@mantine/core'
import { ListIcon, SquaresFourIcon } from '@phosphor-icons/react'

import { Breadcrumbs } from '@features'

import classes from './header.module.css'

const viewmode = [
  {
    label: (
      <Center>
        <ListIcon />
      </Center>
    ),
    value: 'list',
  },
  {
    label: (
      <Center>
        <SquaresFourIcon />
      </Center>
    ),
    value: 'grid',
  },
]

export type HeaderProps = {
  root: string
  path: string
}

export function Header({ root, path }: HeaderProps) {
  return (
    <Stack className={classes.header}>
      <Group gap="md" justify="space-between" p="md">
        <Breadcrumbs root={root} path={path} />
        <SegmentedControl data={viewmode} size="lg" />
      </Group>
    </Stack>
  )
}
