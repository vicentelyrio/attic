import { size } from '@infrastructure'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Portal,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import {
  ArrowsDownUpIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  getJob,
  type Job,
  type JobStatus,
  type JobView,
  useCancelJob,
  useClearJobs,
  useJobs,
  useResolveJob,
} from '@domain'
import { ConflictDialog } from '../conflict-dialog'
import { EntryIcon } from '../files/entry-icon'
import classes from './transfers.module.css'

const TRANSFERRING: JobStatus[] = ['planning', 'queued', 'running']
const ACTIVE: JobStatus[] = [...TRANSFERRING, 'needs_resolution']
const FINISHED: JobStatus[] = ['done', 'failed', 'canceled']

type View = 'expanded' | 'collapsed' | 'hidden'

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function percent(job: Job): number {
  if (job.status === 'done') return 100
  if (job.bytes_total <= 0) return 0
  return Math.min(100, (job.bytes_done / job.bytes_total) * 100)
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60) return `${Math.round(seconds)}s left`
  return `about ${Math.round(seconds / 60)}m left`
}

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

export function Transfers() {
  const { data: jobs } = useJobs()
  const cancel = useCancelJob()
  const resolve = useResolveJob()
  const clear = useClearJobs()
  const qc = useQueryClient()
  const [conflict, setConflict] = useState<JobView | null>(null)
  const [view, setView] = useState<View>('hidden')

  const list = jobs ?? []
  const visible = list.slice(0, 8)
  const activeJobs = visible.filter((j) => ACTIVE.includes(j.status))
  const transferring = visible.filter((j) => TRANSFERRING.includes(j.status))
  const hasFinished = list.some((j) => FINISHED.includes(j.status))

  const bytesDone = transferring.reduce((n, j) => n + j.bytes_done, 0)
  const bytesTotal = transferring.reduce((n, j) => n + j.bytes_total, 0)
  const aggPercent = bytesTotal > 0 ? (bytesDone / bytesTotal) * 100 : 0
  const speed = useRate(bytesDone, transferring.length > 0)
  const remaining = bytesTotal - bytesDone
  const eta = speed > 0 ? formatEta(remaining / speed) : ''

  const known = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!jobs) return
    if (known.current === null) {
      known.current = new Set(jobs.map((j) => j.id))
      return
    }
    const fresh = jobs.some((j) => !known.current?.has(j.id))
    for (const j of jobs) known.current.add(j.id)
    if (fresh) setView('expanded')
  }, [jobs])

  const seen = useRef<Record<string, JobStatus>>({})
  useEffect(() => {
    if (!jobs) return
    let completed = false
    for (const j of jobs) {
      if (seen.current[j.id] !== j.status && j.status === 'done')
        completed = true
      seen.current[j.id] = j.status
    }
    if (completed) qc.invalidateQueries({ queryKey: ['list'] })
  }, [jobs, qc])

  const busy = activeJobs.length > 0
  const count = transferring.length
  const title =
    count > 0
      ? `Transferring ${count} file${count === 1 ? '' : 's'}`
      : busy
        ? 'Resolve conflicts'
        : 'Transfers'
  const subtitle =
    count > 0
      ? [`${size(speed)}/s`, eta].filter(Boolean).join(' · ')
      : list.length > 0
        ? `${list.filter((j) => j.status === 'done').length} complete`
        : 'No transfers yet'

  const spinner = busy ? (
    <Loader color="indigo" size={18} type="oval" />
  ) : (
    <ThemeIcon color="green" radius="xl" size={18} variant="light">
      <CheckIcon size={11} weight="bold" />
    </ThemeIcon>
  )

  const openResolve = async (id: string) => setConflict(await getJob(id))
  const cancelAll = () => {
    for (const j of activeJobs) cancel.mutate(j.id)
  }
  const toggle = () => setView((v) => (v === 'hidden' ? 'expanded' : 'hidden'))

  return (
    <>
      <Button
        variant="default"
        size="xs"
        onClick={toggle}
        leftSection={
          busy ? (
            <Loader color="indigo" size={14} type="oval" />
          ) : (
            <ArrowsDownUpIcon />
          )
        }
        rightSection={
          busy ? (
            <Badge color="indigo" variant="light" size="sm" radius="sm">
              {activeJobs.length}
            </Badge>
          ) : null
        }
      >
        Transfers
      </Button>

      {view === 'collapsed' && (
        <Portal>
          <div className={classes.collapsedDock}>
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
                    {title}
                  </Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    {count > 0
                      ? `${Math.round(aggPercent)}% · ${subtitle}`
                      : subtitle}
                  </Text>
                </div>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  className={classes.iconBtn}
                  onClick={() => setView('expanded')}
                  aria-label="Expand transfers"
                >
                  <CaretUpIcon />
                </ActionIcon>
              </Group>
            </Box>
          </div>
        </Portal>
      )}

      {view === 'expanded' && (
        <Portal>
          <div className={classes.dock}>
            <Box className={classes.panel}>
              <Group
                gap="sm"
                wrap="nowrap"
                px="sm"
                py="xs"
                className={classes.header}
              >
                {spinner}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="md" fw={600} truncate>
                    {title}
                  </Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    {subtitle}
                  </Text>
                </div>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  className={classes.iconBtn}
                  onClick={() => setView('collapsed')}
                  aria-label="Collapse transfers"
                >
                  <CaretDownIcon />
                </ActionIcon>
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

              {list.length > 0 ? (
                <>
                  <Box
                    style={{
                      maxHeight: 340,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                    }}
                  >
                    <Stack gap={0} px="sm" py={4}>
                      {visible.map((job) => (
                        <TransferRow
                          key={job.id}
                          job={job}
                          onCancel={() => cancel.mutate(job.id)}
                          onResolve={() => openResolve(job.id)}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Group
                    gap="sm"
                    wrap="nowrap"
                    px="sm"
                    py="xs"
                    className={classes.footer}
                  >
                    <Text size="xs" c="dimmed">
                      Total{' '}
                      <Text span ff="monospace" c="dark.2">
                        {size(bytesTotal)}
                      </Text>
                    </Text>
                    <Box style={{ flex: 1 }} />
                    {hasFinished && (
                      <UnstyledButton
                        onClick={() => clear.mutate()}
                        disabled={clear.isPending}
                      >
                        <Text size="xs" fw={500} c="dark.3">
                          Clear
                        </Text>
                      </UnstyledButton>
                    )}
                    {busy && (
                      <UnstyledButton onClick={cancelAll}>
                        <Text size="xs" fw={500} c="dark.3">
                          Cancel all
                        </Text>
                      </UnstyledButton>
                    )}
                  </Group>
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="lg">
                  No transfers yet
                </Text>
              )}
            </Box>
          </div>
        </Portal>
      )}

      {conflict && (
        <ConflictDialog
          job={conflict}
          onApply={(req) => {
            resolve.mutate({ id: conflict.id, req })
            setConflict(null)
          }}
          onClose={() => setConflict(null)}
        />
      )}
    </>
  )
}

type TransferRowProps = {
  job: Job
  onCancel: () => void
  onResolve: () => void
}

function TransferRow({ job, onCancel, onResolve }: TransferRowProps) {
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
            classNames={{ root: classes.bar }}
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
