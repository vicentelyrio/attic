import type { ReactNode } from 'react'

import type { ViewMode } from '@infrastructure'

import { Center, Group, SegmentedControl, Stack, Switch } from '@mantine/core'

import { ListIcon, SquaresFourIcon } from '@phosphor-icons/react'

import { Breadcrumbs } from '@features'

import { Transfers } from '../../transfers'
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
  showHidden: boolean
  onShowHiddenChange: (showHidden: boolean) => void
  /** Clipboard actions (copy/cut/paste), rendered on the right. */
  actions?: ReactNode
}

export function Header({
  root,
  path,
  view,
  onViewChange,
  showHidden,
  onShowHiddenChange,
  actions,
}: HeaderProps) {
  return (
    <Stack className={classes.header}>
      <Group gap="md" justify="space-between" py="sm" px="md">
        <Breadcrumbs root={root} path={path} />
        <Group gap="md">
          {actions}
          <Switch
            checked={showHidden}
            withThumbIndicator={false}
            onChange={(event) =>
              onShowHiddenChange(event.currentTarget.checked)
            }
            label="Hidden files"
          />
          <SegmentedControl
            data={viewmode}
            size="lg"
            value={view}
            onChange={(value) => onViewChange(value as ViewMode)}
          />
          <Transfers />
        </Group>
      </Group>
    </Stack>
  )
}
