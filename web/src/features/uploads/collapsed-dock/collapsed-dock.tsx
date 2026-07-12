import {
  ActionIcon,
  Affix,
  Box,
  Group,
  Loader,
  Paper,
  Progress,
  Text,
  ThemeIcon,
} from '@mantine/core'

import { CaretUpIcon, CheckIcon } from '@phosphor-icons/react'

import type { UploadsState } from '../helpers'
import classes from './collapsed-dock.module.css'

export function CollapsedDock({ state }: { state: UploadsState }) {
  const { aggPercent, busy, activeItems, collapsedSubtitle, expand } = state

  return (
    <Affix
      zIndex={300}
      position={{
        bottom: 'var(--mantine-spacing-xl)',
        right: 'var(--mantine-spacing-xl)',
      }}
    >
      <Paper
        withBorder
        shadow="xl"
        radius="lg"
        bg="dark.6"
        w="19rem"
        maw="calc(100vw - 2 * var(--mantine-spacing-xl))"
        style={{ overflow: 'hidden' }}
      >
        <Progress value={aggPercent} size={3} radius={0} />

        <Group gap="sm" wrap="nowrap" px="sm" py={11}>
          {busy ? (
            <Loader color="indigo" size={20} type="oval" />
          ) : (
            <ThemeIcon color="green" radius="xl" size={20} variant="light">
              <CheckIcon size={12} weight="bold" />
            </ThemeIcon>
          )}
          <Box flex={1} miw={0}>
            <Text size="sm" fw={600} truncate>
              {busy
                ? `Uploading ${activeItems.length} file${activeItems.length === 1 ? '' : 's'}`
                : 'Upload complete'}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace">
              {collapsedSubtitle}
            </Text>
          </Box>
          <ActionIcon
            variant="subtle"
            color="gray"
            className={classes.iconBtn}
            onClick={expand}
            aria-label="Expand uploads"
          >
            <CaretUpIcon />
          </ActionIcon>
        </Group>
      </Paper>
    </Affix>
  )
}
