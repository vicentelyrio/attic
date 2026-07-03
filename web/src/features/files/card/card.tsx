import type { MouseEvent, ReactNode } from 'react'

import { sizeParts } from '@infrastructure'

import {
  AspectRatio,
  Group,
  Card as MantineCard,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'

import { FolderSimpleIcon } from '@phosphor-icons/react'

import type { Entry } from '@domain'

import { EntryIcon } from '../entry-icon'
import classes from './card.module.css'
import { LazyMount } from './lazy-mount'
import { FilePlaceholder } from './placeholder'
import { previewStrategies } from './variants'

export type CardProps = {
  entry: Entry
  root: string
  path: string
  selected: boolean
  onSelect: (event: MouseEvent) => void
  onOpen: () => void
}

/** Shared clickable shell: click selects, double-click opens. */
function Shell({
  entry,
  selected,
  onSelect,
  onOpen,
  children,
  padding,
}: Omit<CardProps, 'root' | 'path'> & {
  children: ReactNode
  padding?: string | number
}) {
  return (
    <MantineCard
      renderRoot={(props) => <UnstyledButton {...props} />}
      className={classes.card}
      data-name={entry.name}
      data-selected={selected || undefined}
      data-dimmed={entry.name.startsWith('.') || undefined}
      onClick={onSelect}
      onDoubleClick={onOpen}
      padding={padding}
      w="100%"
    >
      {children}
    </MantineCard>
  )
}

/** Picks the matching preview variant for the entry, deferring heavy ones. */
function Preview({
  entry,
  root,
  path,
}: Pick<CardProps, 'entry' | 'root' | 'path'>) {
  const strategy = previewStrategies.find((s) => s.match(entry))
  const placeholder = <FilePlaceholder entry={entry} />
  const content = strategy
    ? strategy.render({ entry, root, path })
    : placeholder

  // Heavy previews (everything that fetches or decodes) are deferred until
  // scrolled near the viewport; the placeholder shows in the meantime.
  const heavy = strategy ? strategy.heavy !== false : false

  return (
    <AspectRatio ratio={16 / 10}>
      {heavy ? (
        <LazyMount fallback={placeholder}>{content}</LazyMount>
      ) : (
        content
      )}
    </AspectRatio>
  )
}

function FolderCard(props: CardProps) {
  const { entry } = props
  const items = entry.items ?? 0

  return (
    <Shell {...props} padding="md">
      <Group gap="md" wrap="nowrap">
        <ThemeIcon variant="light" color="indigo" size={40} radius="md">
          <FolderSimpleIcon weight="fill" size={22} />
        </ThemeIcon>
        <Stack gap={2} flex={1} miw={0}>
          <Text fw={500} c="dark.0" truncate>
            {entry.name}
          </Text>
          <Text size="sm" c="dark.2">
            {items.toLocaleString()} {items === 1 ? 'item' : 'items'}
          </Text>
        </Stack>
      </Group>
    </Shell>
  )
}

function FileCard(props: CardProps) {
  const { entry, root, path } = props
  const { value, unit } = sizeParts(entry.size)

  return (
    <Shell {...props} padding={0}>
      <MantineCard.Section className={classes.preview}>
        <Preview entry={entry} root={root} path={path} />
      </MantineCard.Section>
      <Group gap="sm" wrap="nowrap" px="md" py="sm">
        <EntryIcon name={entry.name} isDir={false} />
        <Text fw={500} c="dark.0" truncate flex={1} miw={0}>
          {entry.name}
        </Text>
        <Text size="sm" c="dark.2" className={classes.size}>
          {value}{' '}
          <Text span inherit c="dark.3">
            {unit}
          </Text>
        </Text>
      </Group>
    </Shell>
  )
}

/** Entry card — renders a folder or a file (with its preview variant). */
export function Card(props: CardProps) {
  return props.entry.is_dir ? (
    <FolderCard {...props} />
  ) : (
    <FileCard {...props} />
  )
}
