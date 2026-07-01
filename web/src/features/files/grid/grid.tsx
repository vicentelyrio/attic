import { fileKind, isTextFile, sizeParts } from '@infrastructure'
import {
  AspectRatio,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { FolderSimpleIcon } from '@phosphor-icons/react'
import { type ReactNode, useMemo, useState } from 'react'
import { downloadUrl, type Entry } from '@domain'
import { EntryIcon } from '../entry-icon'
import { CodePreview } from './code-preview'
import classes from './grid.module.css'
import { ImagePreview } from './image-preview'
import { ModelPreview } from './model-preview'
import { PdfPreview } from './pdf-preview'
import { FilePlaceholder } from './placeholder'
import { VideoPreview } from './video-preview'

export type GridProps = {
  data?: Entry[]
  root: string
  path: string
  onOpen: (item: Entry) => void
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
  root,
  path,
}: {
  entry: Entry
  root: string
  path: string
}) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const category = fileKind(entry.name).category

  let content: ReactNode
  if (category === 'image') {
    content = <ImagePreview entry={entry} src={downloadUrl(root, filePath)} />
  } else if (category === 'video') {
    content = <VideoPreview entry={entry} root={root} path={path} />
  } else if (category === 'pdf') {
    content = <PdfPreview entry={entry} root={root} path={path} />
  } else if (category === 'model') {
    content = <ModelPreview entry={entry} root={root} path={path} />
  } else if (isTextFile(entry.name)) {
    content = <CodePreview entry={entry} root={root} path={path} />
  } else {
    content = <FilePlaceholder entry={entry} />
  }

  return <AspectRatio ratio={16 / 10}>{content}</AspectRatio>
}

function FileCard(props: CardProps & { root: string; path: string }) {
  const { entry, root, path } = props
  const { value, unit } = sizeParts(entry.size)

  return (
    <EntryCard {...props} padding={0}>
      <Card.Section className={classes.preview}>
        <FilePreview entry={entry} root={root} path={path} />
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

export function Grid({ data, root, path, onOpen }: GridProps) {
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
    <Box className={classes.scroll}>
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
                root={root}
                path={path}
              />
            ))}
          </Section>
        )}
      </Stack>
    </Box>
  )
}
