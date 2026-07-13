import { SHORTCUTS } from '@infrastructure'

import { ActionIcon, Group, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'

import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'

import classes from './footer.module.css'

export type FooterProps = {
  root: string
  path: string
  count: number
  hidden: number
  showHidden: boolean
  onShowHiddenChange: (showHidden: boolean) => void
}

export function Footer({
  root,
  path,
  count,
  hidden,
  showHidden,
  onShowHiddenChange,
}: FooterProps) {
  const fullPath = path ? `/${root}/${path}` : `/${root}`

  useHotkeys([
    [SHORTCUTS.showHidden.hotkey, () => onShowHiddenChange(!showHidden)],
  ])

  return (
    <Group className={classes.footer}>
      <Text size="xs" c="dimmed" ff="monospace" truncate="end">
        {fullPath}
      </Text>
      <Group className={classes.count}>
        <Text size="xs" c="dimmed" ff="monospace">
          {count.toLocaleString()} {count === 1 ? 'file' : 'files'}
          {hidden > 0 && ` (${hidden.toLocaleString()} hidden)`}
        </Text>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          c="dimmed"
          aria-label={showHidden ? 'Hide hidden files' : 'Show hidden files'}
          onClick={() => onShowHiddenChange(!showHidden)}
        >
          {showHidden ? <EyeIcon size={14} /> : <EyeSlashIcon size={14} />}
        </ActionIcon>
      </Group>
    </Group>
  )
}
