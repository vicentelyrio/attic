import { ActionIcon, Affix, Divider, Group, Paper, Text } from '@mantine/core'

import { XIcon } from '@phosphor-icons/react'

import { DockFooter } from '../dock-footer'
import type { TransfersState } from '../helpers'
import { TransferList } from '../transfer-list'
import { TransferSummary } from '../transfer-summary'
import classes from './expanded-dock.module.css'

export function ExpandedDock({ state }: { state: TransfersState }) {
  const { busy, title, subtitle, list, setView } = state

  return (
    <Affix
      zIndex={300}
      position={{
        bottom: 'var(--mantine-spacing-xl)',
        left: 'calc(300px - var(--mantine-spacing-xs))',
      }}
    >
      <Paper
        withBorder
        shadow="xl"
        radius="lg"
        bg="dark.6"
        w={340}
        maw="calc(100vw - 2 * var(--mantine-spacing-xl))"
        style={{ overflow: 'hidden' }}
      >
        <Group gap="sm" wrap="nowrap" px="sm" py="xs">
          <TransferSummary
            busy={busy}
            title={title}
            subtitle={subtitle}
            titleSize="md"
          />
          <ActionIcon
            variant="subtle"
            color="gray"
            className={classes.iconBtn}
            onClick={() => setView('hidden')}
            aria-label="Dismiss transfers"
          >
            <XIcon />
          </ActionIcon>
        </Group>

        <Divider color="dark.5" />

        {list.length > 0 ? (
          <>
            <TransferList state={state} />
            <Divider color="dark.5" />
            <DockFooter state={state} />
          </>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            No transfers yet
          </Text>
        )}
      </Paper>
    </Affix>
  )
}
