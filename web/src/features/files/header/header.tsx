import type { ReactNode } from 'react'

import type { ViewMode } from '@infrastructure'

import { Center, Group, SegmentedControl, Stack } from '@mantine/core'

import { ListIcon, SquaresFourIcon } from '@phosphor-icons/react'

import { Breadcrumbs } from '@features'

import { Transfers } from '../../transfers'
import { Uploads } from '../../uploads'
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
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  /** Clipboard actions (copy/cut/paste), rendered on the right. */
  actions?: ReactNode
}

export function Header({
  root,
  path,
  view,
  onViewChange,
  actions,
}: HeaderProps) {
  return (
    <Stack className={classes.header}>
      <Group gap="md" justify="space-between" py="sm" px="md">
        <Breadcrumbs root={root} path={path} />
        <Group gap="md">
          {actions}
          <SegmentedControl
            data={viewmode}
            size="lg"
            value={view}
            onChange={(value) => onViewChange(value as ViewMode)}
          />
          <Transfers />
          <Uploads root={root} path={path} />
        </Group>
      </Group>
    </Stack>
  )
}
