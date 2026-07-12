import {
  Badge,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'

import { ArrowsDownUpIcon } from '@phosphor-icons/react'

import type { TransfersState } from '../helpers'
import classes from './transfers-trigger.module.css'

export function TransfersTrigger({ state }: { state: TransfersState }) {
  const { busy, activeCount, count, aggPercent, sidebarStatus, toggle } = state

  return (
    <Paper
      component="button"
      type="button"
      shadow="md"
      p="md"
      withBorder
      onClick={toggle}
      className={classes.trigger}
      aria-label="Transfers"
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            {busy ? (
              <Loader color="indigo" size={16} type="oval" />
            ) : (
              <ThemeIcon color="gray" variant="transparent" size={16} p={0}>
                <ArrowsDownUpIcon />
              </ThemeIcon>
            )}
            <Text size="sm">Transfers</Text>
          </Group>
          {busy && (
            <Badge color="indigo" variant="light" size="sm" radius="sm">
              {activeCount}
            </Badge>
          )}
        </Group>

        {count > 0 && <Progress value={aggPercent} size="sm" />}

        <Text size="xs" c="dimmed" truncate>
          {sidebarStatus}
        </Text>
      </Stack>
    </Paper>
  )
}
