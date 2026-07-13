import { SHORTCUTS, type ShortcutId } from '@infrastructure'

import { Group, Text } from '@mantine/core'

import classes from './preview-hints.module.css'

type Hint = { id: ShortcutId; label: string }

const HINTS: Hint[] = [
  { id: 'previewNav', label: 'previous / next' },
  { id: 'previewZoom', label: 'zoom' },
  { id: 'previewInfo', label: 'info panel' },
  { id: 'previewClose', label: 'close' },
]

function Kbd({ children }: { children: string }) {
  return <kbd className={classes.kbd}>{children}</kbd>
}

export function PreviewHints() {
  return (
    <Group className={classes.hints} gap="lg" justify="center" wrap="nowrap">
      {HINTS.map((hint) => (
        <Group key={hint.label} gap={6} wrap="nowrap">
          {SHORTCUTS[hint.id].keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
          <Text size="xs" c="dark.3">
            {hint.label}
          </Text>
        </Group>
      ))}
    </Group>
  )
}
