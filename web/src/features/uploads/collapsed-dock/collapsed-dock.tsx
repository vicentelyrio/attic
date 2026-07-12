import {
  ActionIcon,
  Box,
  Group,
  Loader,
  Portal,
  Text,
  ThemeIcon,
} from '@mantine/core'

import { CaretUpIcon, CheckIcon } from '@phosphor-icons/react'

import type { UploadsState } from '../helpers'
import classes from './collapsed-dock.module.css'

export function CollapsedDock({ state }: { state: UploadsState }) {
  const { aggPercent, busy, activeItems, collapsedSubtitle, expand } = state

  return (
    <Portal>
      <div className={classes.dock}>
        <Box className={classes.panel}>
          <div className={classes.pillTrack}>
            <div
              className={classes.pillFill}
              style={{ width: `${aggPercent}%` }}
            />
          </div>
          <Group gap="sm" wrap="nowrap" px="sm" py={11}>
            {busy ? (
              <Loader color="indigo" size={20} type="oval" />
            ) : (
              <ThemeIcon color="green" radius="xl" size={20} variant="light">
                <CheckIcon size={12} weight="bold" />
              </ThemeIcon>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>
                {busy
                  ? `Uploading ${activeItems.length} file${activeItems.length === 1 ? '' : 's'}`
                  : 'Upload complete'}
              </Text>
              <Text size="xs" c="dimmed" ff="monospace">
                {collapsedSubtitle}
              </Text>
            </div>
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
        </Box>
      </div>
    </Portal>
  )
}
