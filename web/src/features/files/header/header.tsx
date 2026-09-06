import type { ReactNode } from 'react'

import { useI18nContext } from '@i18n'
import {
  type SortField,
  type SortState,
  toggleSortField,
  type ViewMode,
} from '@infrastructure'

import {
  ActionIcon,
  Center,
  Group,
  Menu,
  SegmentedControl,
  Stack,
} from '@mantine/core'

import {
  ArrowsDownUpIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  ListIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react'

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
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  sort: SortState
  onSortChange: (sort: SortState) => void
  actions?: ReactNode
}

export function Header({
  root,
  path,
  view,
  onViewChange,
  sort,
  onSortChange,
  actions,
}: HeaderProps) {
  const { LL } = useI18nContext()

  const fields: { field: SortField; label: string }[] = [
    { field: 'name', label: LL.common.name() },
    { field: 'size', label: LL.common.size() },
    { field: 'kind', label: LL.common.kind() },
    { field: 'modified', label: LL.common.modified() },
  ]

  return (
    <Stack className={classes.header}>
      <Group gap="md" justify="space-between" py="sm" px="md">
        <Breadcrumbs root={root} path={path} />
        <Group gap="md">
          {actions}
          <Menu position="bottom-end" offset={4} shadow="lg" radius="md">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label={LL.sort.sortBy()}
              >
                <ArrowsDownUpIcon size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{LL.sort.sortBy()}</Menu.Label>
              {fields.map(({ field, label }) => (
                <Menu.Item
                  key={field}
                  onClick={() => onSortChange(toggleSortField(sort, field))}
                  rightSection={
                    sort.field === field ? <CheckIcon size={14} /> : undefined
                  }
                >
                  {label}
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item
                onClick={() => onSortChange({ ...sort, direction: 'asc' })}
                leftSection={<CaretUpIcon size={14} />}
                rightSection={
                  sort.direction === 'asc' ? <CheckIcon size={14} /> : undefined
                }
              >
                {LL.sort.ascending()}
              </Menu.Item>
              <Menu.Item
                onClick={() => onSortChange({ ...sort, direction: 'desc' })}
                leftSection={<CaretDownIcon size={14} />}
                rightSection={
                  sort.direction === 'desc' ? (
                    <CheckIcon size={14} />
                  ) : undefined
                }
              >
                {LL.sort.descending()}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <SegmentedControl
            data={viewmode}
            size="lg"
            value={view}
            onChange={(value) => onViewChange(value as ViewMode)}
            classNames={{ label: classes.viewLabel }}
          />
        </Group>
      </Group>
    </Stack>
  )
}
