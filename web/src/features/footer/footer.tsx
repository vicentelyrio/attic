import { useI18nContext } from '@i18n'
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
  const { LL } = useI18nContext()
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
          {LL.files.fileCount({ count })}
          {hidden > 0 && ` ${LL.files.hiddenCount({ count: hidden })}`}
        </Text>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          c="dimmed"
          aria-label={
            showHidden ? LL.files.hideHidden() : LL.files.showHidden()
          }
          onClick={() => onShowHiddenChange(!showHidden)}
        >
          {showHidden ? <EyeIcon size={14} /> : <EyeSlashIcon size={14} />}
        </ActionIcon>
      </Group>
    </Group>
  )
}
