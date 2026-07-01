import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { XIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  getJob,
  type Job,
  type JobStatus,
  type JobView,
  useCancelJob,
  useJobs,
  useResolveJob,
} from '@domain'
import { ConflictDialog } from '../conflict-dialog'
import classes from './transfers.module.css'

const ACTIVE: JobStatus[] = ['planning', 'queued', 'running']

const STATUS_COLOR: Record<JobStatus, string> = {
  planning: 'blue',
  queued: 'blue',
  running: 'blue',
  needs_resolution: 'yellow',
  done: 'green',
  failed: 'red',
  canceled: 'gray',
}

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function percent(job: Job): number {
  if (job.status === 'done') return 100
  if (job.bytes_total <= 0) return 0
  return Math.min(100, (job.bytes_done / job.bytes_total) * 100)
}

/** Floating panel reflecting server-side job state — correct across tab
 *  reopens and reloads. Also hosts the resolve (conflict) and cancel controls,
 *  and refreshes directory listings when a job completes. */
export function Transfers() {
  const { data: jobs } = useJobs()
  const cancel = useCancelJob()
  const resolve = useResolveJob()
  const qc = useQueryClient()
  const [conflict, setConflict] = useState<JobView | null>(null)

  // When a job finishes, its destination changed — refresh cached listings.
  const seen = useRef<Record<string, JobStatus>>({})
  useEffect(() => {
    if (!jobs) return
    let completed = false
    for (const j of jobs) {
      if (seen.current[j.id] !== j.status && j.status === 'done') {
        completed = true
      }
      seen.current[j.id] = j.status
    }
    if (completed) qc.invalidateQueries({ queryKey: ['list'] })
  }, [jobs, qc])

  if (!jobs || jobs.length === 0) return null

  const openResolve = async (id: string) => {
    setConflict(await getJob(id))
  }

  const visible = jobs.slice(0, 6)

  return (
    <>
      <Card className={classes.panel} shadow="md" padding="sm" radius="md">
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
          Transfers
        </Text>
        <ScrollArea.Autosize mah={320}>
          <Stack gap="sm">
            {visible.map((job) => (
              <Stack key={job.id} gap={4}>
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Text size="sm" truncate title={job.src_path}>
                    {job.op === 'move' ? 'Move' : 'Copy'}{' '}
                    {basename(job.src_path)}
                  </Text>
                  <Badge
                    color={STATUS_COLOR[job.status]}
                    size="sm"
                    variant="light"
                  >
                    {job.status.replace('_', ' ')}
                  </Badge>
                </Group>

                {ACTIVE.includes(job.status) && (
                  <Group gap="xs" wrap="nowrap">
                    <Progress value={percent(job)} flex={1} size="sm" />
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => cancel.mutate(job.id)}
                      aria-label="Cancel"
                    >
                      <XIcon />
                    </ActionIcon>
                  </Group>
                )}

                {job.status === 'needs_resolution' && (
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => openResolve(job.id)}
                  >
                    Resolve conflicts
                  </Button>
                )}

                {job.status === 'failed' && job.error && (
                  <Text size="xs" c="red" truncate title={job.error}>
                    {job.error}
                  </Text>
                )}
              </Stack>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Card>

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
