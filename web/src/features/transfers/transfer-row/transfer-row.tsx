import { size } from '@infrastructure'

import {
  ActionIcon,
  Button,
  Group,
  Progress,
  Text,
  ThemeIcon,
} from '@mantine/core'

import { CheckIcon, XIcon } from '@phosphor-icons/react'

import type { Job } from '@domain'

import { EntryIcon } from '../../files/entry-icon'
import { basename, percent, TRANSFERRING } from '../helpers'
import classes from './transfer-row.module.css'

type TransferRowProps = {
  job: Job
  onCancel: () => void
  onResolve: () => void
}

export function TransferRow({ job, onCancel, onResolve }: TransferRowProps) {
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
            title={job.src_path}
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
            Resolve conflicts
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
        <ThemeIcon color="green" radius="xl" size={16} variant="filled">
          <CheckIcon size={9} weight="bold" color="#08120d" />
        </ThemeIcon>
      ) : isMoving ? (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          className={classes.iconBtn}
          onClick={onCancel}
          aria-label="Cancel transfer"
        >
          <XIcon />
        </ActionIcon>
      ) : null}
    </Group>
  )
}

function RowMeta({ job }: { job: Job }) {
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
        Waiting
      </Text>
    )
  }
  return null
}
