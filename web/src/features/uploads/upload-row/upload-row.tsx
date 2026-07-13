import { size } from '@infrastructure'

import {
  ActionIcon,
  Group,
  Loader,
  Progress,
  Text,
  ThemeIcon,
} from '@mantine/core'

import { CheckIcon, XIcon } from '@phosphor-icons/react'

import type { Upload } from '@domain'

import { EntryIcon } from '../../files/entry-icon'
import { percent } from '../helpers'
import classes from './upload-row.module.css'

type UploadRowProps = {
  item: Upload
  onCancel: () => void
}

export function UploadRow({ item, onCancel }: UploadRowProps) {
  const isDone = item.status === 'done'
  const isError = item.status === 'error'
  const isCanceled = item.status === 'canceled'
  const isWaiting = item.status === 'waiting'
  const isUploading = item.status === 'uploading'

  const barColor = isDone
    ? 'green'
    : isError
      ? 'red'
      : isCanceled
        ? 'gray'
        : 'indigo'

  return (
    <Group gap="sm" wrap="nowrap" py="xs" className={classes.row}>
      <EntryIcon name={item.name} isDir={false} />

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
            title={item.name}
            style={{ flex: 1, minWidth: 0 }}
          >
            {item.name}
          </Text>
          <span style={{ flexShrink: 0 }}>
            <RowMeta item={item} />
          </span>
        </div>
        {isError && item.error ? (
          <Text size="xs" c="red" truncate title={item.error}>
            {item.error}
          </Text>
        ) : (
          <Progress
            value={percent(item)}
            color={barColor}
            size={4}
            radius="xl"
          />
        )}
      </div>

      <div className={classes.status}>
        {isDone ? (
          <ThemeIcon color="green" radius="xl" size={20} variant="filled">
            <CheckIcon
              size={11}
              weight="bold"
              color="var(--mantine-color-white)"
            />
          </ThemeIcon>
        ) : isUploading ? (
          <Loader color="indigo" size={20} type="oval" />
        ) : isWaiting ? (
          <>
            <span className={classes.waitCircle} aria-hidden />
            <ActionIcon
              variant="subtle"
              color="gray"
              size={22}
              radius="xl"
              className={`${classes.iconBtn} ${classes.waitCancel}`}
              onClick={onCancel}
              aria-label="Remove from queue"
            >
              <XIcon />
            </ActionIcon>
          </>
        ) : null}
      </div>
    </Group>
  )
}

function RowMeta({ item }: { item: Upload }) {
  if (item.status === 'done') {
    return (
      <Text size="xs" c="dark.4" ff="monospace">
        {size(item.size)}
      </Text>
    )
  }
  if (item.status === 'uploading') {
    return (
      <Text size="xs" c="indigo.3" ff="monospace">
        {Math.round(percent(item))}% · {size(item.size)}
      </Text>
    )
  }
  if (item.status === 'waiting') {
    return (
      <Text size="xs" c="dark.4" ff="monospace">
        Waiting
      </Text>
    )
  }
  if (item.status === 'canceled') {
    return (
      <Text size="xs" c="dark.4" ff="monospace">
        Canceled
      </Text>
    )
  }
  return null
}
