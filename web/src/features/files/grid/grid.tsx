import { type MouseEvent, type ReactNode, useCallback, useMemo, useRef } from 'react'

import type { SelectMods } from '@infrastructure'

import { Box, SimpleGrid, Stack, Text } from '@mantine/core'

import type { Entry } from '@domain'

import { Card } from '../card'
import classes from './grid.module.css'

export type GridProps = {
  data?: Entry[]
  root: string
  path: string
  onOpen: (item: Entry) => void
  selected: Set<string>
  onSelect: (name: string, mods: SelectMods) => void
  onClearSelection: () => void
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

export function Grid({
  data,
  root,
  path,
  onOpen,
  selected,
  onSelect,
  onClearSelection,
}: GridProps) {
  const { folders, files } = useMemo(() => {
    const folders: Entry[] = []
    const files: Entry[] = []
    for (const entry of data ?? []) {
      ;(entry.is_dir ? folders : files).push(entry)
    }
    return { folders, files }
  }, [data])

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  const handleSelect = useCallback((entry: Entry, event: MouseEvent) => {
    event.stopPropagation()
    onSelectRef.current(entry.name, {
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    })
  }, [])

  const handleOpen = useCallback((entry: Entry) => {
    onOpenRef.current(entry)
  }, [])

  return (
    <Box
      className={classes.scroll}
      onClick={onClearSelection}
      onKeyDown={(e) => e.key === 'Escape' && onClearSelection()}
    >
      <Stack gap="xl">
        {folders.length > 0 && (
          <Section label="Folders">
            {folders.map((entry) => (
              <Card
                key={entry.name}
                entry={entry}
                root={root}
                path={path}
                selected={selected.has(entry.name)}
                onSelect={handleSelect}
                onOpen={handleOpen}
              />
            ))}
          </Section>
        )}

        {files.length > 0 && (
          <Section label="Files">
            {files.map((entry) => (
              <Card
                key={entry.name}
                entry={entry}
                root={root}
                path={path}
                selected={selected.has(entry.name)}
                onSelect={handleSelect}
                onOpen={handleOpen}
              />
            ))}
          </Section>
        )}
      </Stack>
    </Box>
  )
}
