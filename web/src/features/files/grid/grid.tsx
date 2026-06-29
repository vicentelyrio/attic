import { fileKind, sizeParts } from '@infrastructure'
import {
  AspectRatio,
  Box,
  Card,
  Center,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { FolderSimpleIcon, PlayIcon } from '@phosphor-icons/react'
import { type ReactNode, useMemo, useState } from 'react'
import type { Entry } from '@domain'
import { EntryIcon } from '../entry-icon'
import classes from './grid.module.css'

export type GridProps = {
  data?: Entry[]
  onOpen: (item: Entry) => void
  /**
   * Render the preview surface for a file card. Return `undefined` to fall
   * back to the tinted category placeholder. This is the slot for video
   * players, image previews and code/text previews.
   */
  renderPreview?: (entry: Entry) => ReactNode
}

type CardProps = {
  entry: Entry
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}

function EntryCard({
  entry,
  selected,
  onSelect,
  onOpen,
  children,
  padding,
}: CardProps & { children: ReactNode; padding?: string | number }) {
  return (
    <Card
      renderRoot={(props) => <UnstyledButton {...props} />}
      className={classes.card}
      data-selected={selected || undefined}
      data-dimmed={entry.name.startsWith('.') || undefined}
      onClick={onSelect}
      onDoubleClick={onOpen}
      padding={padding}
      w="100%"
    >
      {children}
    </Card>
  )
}

function FolderCard(props: CardProps) {
  const { entry } = props
  const items = entry.items ?? 0

  return (
    <EntryCard {...props} padding="md">
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
    </EntryCard>
  )
}

function FilePreview({
  entry,
  renderPreview,
}: {
  entry: Entry
  renderPreview?: (entry: Entry) => ReactNode
}) {
  const { category, color } = fileKind(entry.name)
  const custom = renderPreview?.(entry)

  return (
    <AspectRatio ratio={16 / 10}>
      {custom !== undefined && custom !== null && custom !== false ? (
        custom
      ) : (
        <Center
          className={classes.preview}
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 9%, var(--mantine-color-dark-7))`,
          }}
        >
          {category === 'video' ? (
            <ThemeIcon variant="default" radius="xl" size={44}>
              <PlayIcon weight="fill" size={18} />
            </ThemeIcon>
          ) : (
            <Text className={classes.category} c={color}>
              {category}
            </Text>
          )}
        </Center>
      )}
    </AspectRatio>
  )
}

function FileCard(
  props: CardProps & { renderPreview?: GridProps['renderPreview'] },
) {
  const { entry, renderPreview } = props
  const { value, unit } = sizeParts(entry.size)

  return (
    <EntryCard {...props} padding={0}>
      <Card.Section className={classes.preview}>
        <FilePreview entry={entry} renderPreview={renderPreview} />
      </Card.Section>
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
    </EntryCard>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="sm">
      <Text
        tt="uppercase"
        size="xs"
        fw={600}
        c="dark.3"
        className={classes.label}
      >
        {label}
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
        {children}
      </SimpleGrid>
    </Stack>
  )
}

export function Grid({ data, onOpen, renderPreview }: GridProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const { folders, files } = useMemo(() => {
    const folders: Entry[] = []
    const files: Entry[] = []
    for (const entry of data ?? []) {
      ;(entry.is_dir ? folders : files).push(entry)
    }
    return { folders, files }
  }, [data])

  const cardProps = (entry: Entry): CardProps => ({
    entry,
    selected: selected === entry.name,
    onSelect: () => setSelected(entry.name),
    onOpen: () => onOpen(entry),
  })

  return (
    <Box flex={1} mih={0} p="md" style={{ overflowY: 'auto' }}>
      <Stack gap="xl">
        {folders.length > 0 && (
          <Section label="Folders">
            {folders.map((entry) => (
              <FolderCard key={entry.name} {...cardProps(entry)} />
            ))}
          </Section>
        )}

        {files.length > 0 && (
          <Section label="Files">
            {files.map((entry) => (
              <FileCard
                key={entry.name}
                {...cardProps(entry)}
                renderPreview={renderPreview}
              />
            ))}
          </Section>
        )}
      </Stack>
    </Box>
  )
}
