import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import {
  ActionIcon,
  Button,
  Group,
  Progress,
  Text,
  ThemeIcon,
} from '@mantine/core'

import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react'

import { type Job, useUndoMove } from '@domain'

import { basename, percent, TRANSFERRING, transferTooltip } from '../helpers'
import classes from './transfer-row.module.css'
import { EntryIcon } from '@/features/files/entry-icon'

type TransferRowProps = {
  job: Job
  onCancel: () => void
  onResolve: () => void
}

export function TransferRow({ job, onCancel, onResolve }: TransferRowProps) {
  const { LL } = useI18nContext()
  const undoMove = useUndoMove()
  const name = basename(job.src_path)
  const isDone = job.status === 'done'
  const isFailed = job.status === 'failed'
  const isConflict = job.status === 'needs_resolution'
  const isMoving = TRANSFERRING.includes(job.status)

  const barColor = isDone
    ? 'green'
    : isFailed
      ? 'red'
      : isConflict
        ? 'yellow'
        : 'indigo'

  return (
    <Group gap="sm" wrap="nowrap" py="xs" className={classes.row}>
      <EntryIcon name={name} isDir={false} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 5,
            minWidth: 0,
          }}
        >
          <Text
            size="sm"
            c={isDone ? 'dark.1' : 'dark.0'}
            truncate
            title={transferTooltip(job)}
            style={{ flex: 1, minWidth: 0 }}
          >
            {name}
          </Text>
          <span style={{ flexShrink: 0 }}>
            <RowMeta job={job} />
          </span>
        </div>
        {isConflict ? (
          <Button
            size="compact-xs"
            variant="light"
            color="yellow"
            onClick={onResolve}
          >
            {LL.transfers.resolveConflicts()}
          </Button>
        ) : isFailed && job.error ? (
          <Text size="xs" c="red" truncate title={job.error}>
            {job.error}
          </Text>
        ) : (
          <Progress
            value={percent(job)}
            color={barColor}
            size={4}
            radius="xl"
          />
        )}
      </div>

      {isDone ? (
        <Group gap={4} wrap="nowrap">
          {job.op === 'move' && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              className={classes.iconBtn}
              onClick={() => undoMove(job)}
              aria-label={LL.transfers.undo()}
            >
              <ArrowCounterClockwiseIcon size={13} />
            </ActionIcon>
          )}
          <ThemeIcon color="green" radius="xl" size={16} variant="filled">
            <CheckIcon size={9} weight="bold" color="#08120d" />
          </ThemeIcon>
        </Group>
      ) : isMoving ? (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          className={classes.iconBtn}
          onClick={onCancel}
          aria-label={LL.transfers.cancelTransfer()}
        >
          <XIcon />
        </ActionIcon>
      ) : null}
    </Group>
  )
}

function RowMeta({ job }: { job: Job }) {
  const { LL } = useI18nContext()

  if (job.status === 'done') {
    return (
      <Text size="xs" c="dark.4" ff="monospace">
        {size(job.bytes_total)}
      </Text>
    )
  }
  if (TRANSFERRING.includes(job.status)) {
    if (job.status === 'running') {
      return (
        <Text size="xs" c="indigo.3" ff="monospace">
          {Math.round(percent(job))}%
        </Text>
      )
    }
    return (
      <Text size="xs" c="dark.4" ff="monospace">
        {LL.common.waiting()}
      </Text>
    )
  }
  return null
}
