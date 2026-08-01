import { useI18nContext } from '@i18n'
import { SHORTCUTS, type ShortcutId } from '@infrastructure'

import { Group, Text } from '@mantine/core'

import classes from './preview-hints.module.css'

type HintKey = 'nav' | 'zoom' | 'info' | 'close'
type Hint = { id: ShortcutId; key: HintKey }

const HINTS: Hint[] = [
  { id: 'previewNav', key: 'nav' },
  { id: 'previewZoom', key: 'zoom' },
  { id: 'previewInfo', key: 'info' },
  { id: 'previewClose', key: 'close' },
]

function Kbd({ children }: { children: string }) {
  return <kbd className={classes.kbd}>{children}</kbd>
}

export function PreviewHints() {
  const { LL } = useI18nContext()

  return (
    <Group className={classes.hints} gap="lg" justify="center" wrap="nowrap">
      {HINTS.map((hint) => (
        <Group key={hint.key} gap={6} wrap="nowrap">
          {SHORTCUTS[hint.id].keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
          <Text size="xs" c="dark.3">
            {LL.preview.hints[hint.key]()}
          </Text>
        </Group>
      ))}
    </Group>
  )
}
