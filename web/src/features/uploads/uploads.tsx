import { useEffect, useRef, useState } from 'react'

import { size } from '@infrastructure'

import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Portal,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'

import {
  ArrowUpIcon,
  CaretUpIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react'

import { type Upload, useUploads } from '@domain'

import { EntryIcon } from '../files/entry-icon'
import classes from './uploads.module.css'

type View = 'hidden' | 'modal' | 'collapsed'

const ACTIVE: Upload['status'][] = ['waiting', 'uploading']

function percent(item: Upload): number {
  if (item.status === 'done') return 100
  if (item.size <= 0) return 0
  return Math.min(100, (item.loaded / item.size) * 100)
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60) return `${Math.round(seconds)}s left`
  return `${Math.round(seconds / 60)}m left`
}

/** Smoothed transfer rate (bytes/s) from a running byte count. */
function useRate(bytes: number, active: boolean): number {
  const ref = useRef({ t: 0, b: 0, speed: 0 })
  const [speed, setSpeed] = useState(0)

  useEffect(() => {
    if (!active) {
      ref.current = { t: 0, b: 0, speed: 0 }
      setSpeed(0)
      return
    }
    const now = performance.now()
    const prev = ref.current
    if (prev.t > 0) {
      const dt = (now - prev.t) / 1000
      const db = bytes - prev.b
      if (dt > 0 && db >= 0) {
        const inst = db / dt
        const smooth = prev.speed > 0 ? prev.speed * 0.6 + inst * 0.4 : inst
        ref.current = { t: now, b: bytes, speed: smooth }
        setSpeed(smooth)
        return
      }
    }
    ref.current = { t: now, b: bytes, speed: prev.speed }
  }, [bytes, active])

  return speed
}

export type UploadsProps = {
  root: string
  path: string
}

/** The whole upload surface: the header "Upload" button plus the modal and the
 *  minimized dock, all sharing one client-side queue. Modeled on Transfers so
 *  the two docks read as the same family. */
export function Uploads({ root, path }: UploadsProps) {
  const { items, add, cancel, cancelAll, clear } = useUploads(root, path)
  const [view, setView] = useState<View>('hidden')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeItems = items.filter((it) => ACTIVE.includes(it.status))
  const doneCount = items.filter((it) => it.status === 'done').length
  const busy = activeItems.length > 0

  const bytesTotal = items.reduce((n, it) => n + it.size, 0)
  const bytesDone = items.reduce(
    (n, it) => n + (it.status === 'done' ? it.size : it.loaded),
    0,
  )
  const aggPercent = bytesTotal > 0 ? (bytesDone / bytesTotal) * 100 : 0
  const speed = useRate(bytesDone, busy)
  const eta = speed > 0 ? formatEta((bytesTotal - bytesDone) / speed) : ''

  const location = path ? path.split('/').join(' / ') : root

  const openPicker = () => inputRef.current?.click()

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    add(Array.from(files))
    setView('modal')
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const closeModal = () => {
    if (busy) {
      setView('collapsed')
    } else {
      clear()
      setView('hidden')
    }
  }

  const done = () => {
    clear()
    setView('hidden')
  }

  const collapsedSubtitle = [
    `${Math.round(aggPercent)}%`,
    speed > 0 ? `${size(speed)}/s` : '',
    eta,
  ]
    .filter(Boolean)
    .join(' · ')

  const spinner = busy ? (
    <Loader color="indigo" size={20} type="oval" />
  ) : (
    <ThemeIcon color="green" radius="xl" size={20} variant="light">
      <CheckIcon size={12} weight="bold" />
    </ThemeIcon>
  )

  return (
    <>
      <Button
        size="xs"
        leftSection={<PlusIcon weight="bold" />}
        onClick={() => setView('modal')}
      >
        Upload
      </Button>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.currentTarget.files)
          e.currentTarget.value = ''
        }}
      />

      <Modal.Root
        opened={view === 'modal'}
        onClose={closeModal}
        size="lg"
        centered
      >
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title className={classes.title}>
              Upload to <span className={classes.location}>{location}</span>
            </Modal.Title>
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                variant="subtle"
                color="gray"
                className={classes.iconBtn}
                onClick={() => setView('collapsed')}
                aria-label="Minimize"
              >
                <MinusIcon />
              </ActionIcon>
              <Modal.CloseButton />
            </Group>
          </Modal.Header>

          <Modal.Body>
            <Stack gap="md">
              <button
                type="button"
                className={`${classes.dropzone} ${dragging ? classes.dropzoneActive : ''}`}
                onClick={openPicker}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <span className={classes.dropCircle}>
                  <ArrowUpIcon size={20} weight="bold" />
                </span>
                <Text size="lg" fw={500}>
                  Drop files here, or{' '}
                  <span className={classes.browse}>browse</span>
                </Text>
                <Text size="xs" c="dimmed" ff="monospace">
                  Up to 5 GB per file · resumable · chunked
                </Text>
              </button>

              {items.length > 0 && (
                <>
                  <Group justify="space-between" wrap="nowrap">
                    <Text
                      size="xs"
                      c="dimmed"
                      fw={600}
                      className={classes.queueLabel}
                    >
                      QUEUE · {doneCount} of {items.length} done
                    </Text>
                    {speed > 0 && (
                      <Text size="xs" c="dimmed" ff="monospace">
                        {size(speed)}/s
                      </Text>
                    )}
                  </Group>

                  <Box mah={320} style={{ overflowY: 'auto' }}>
                    <Stack gap={0}>
                      {items.map((item) => (
                        <UploadRow
                          key={item.id}
                          item={item}
                          onCancel={() => cancel(item.id)}
                        />
                      ))}
                    </Stack>
                  </Box>
                </>
              )}

              <Group justify="space-between" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  {items.length > 0 && (
                    <>
                      Total{' '}
                      <Text span ff="monospace" c="dark.2">
                        {size(bytesTotal)}
                      </Text>
                      {eta && ` · ${eta}`}
                    </>
                  )}
                </Text>
                <Group gap="xs" wrap="nowrap">
                  {busy && (
                    <Button variant="default" size="xs" onClick={cancelAll}>
                      Cancel all
                    </Button>
                  )}
                  <Button size="xs" onClick={done}>
                    Done
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      {view === 'collapsed' && (
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
                {spinner}
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
                  onClick={() => setView('modal')}
                  aria-label="Expand uploads"
                >
                  <CaretUpIcon />
                </ActionIcon>
              </Group>
            </Box>
          </div>
        </Portal>
      )}
    </>
  )
}

type UploadRowProps = {
  item: Upload
  onCancel: () => void
}

function UploadRow({ item, onCancel }: UploadRowProps) {
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
            classNames={{ root: classes.bar }}
            radius="xl"
          />
        )}
      </div>

      {isDone ? (
        <ThemeIcon color="green" radius="xl" size={16} variant="filled">
          <CheckIcon size={9} weight="bold" color="#08120d" />
        </ThemeIcon>
      ) : isUploading ? (
        <Loader color="indigo" size={16} type="oval" />
      ) : isWaiting ? (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          className={classes.iconBtn}
          onClick={onCancel}
          aria-label="Remove from queue"
        >
          <XIcon />
        </ActionIcon>
      ) : null}
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
