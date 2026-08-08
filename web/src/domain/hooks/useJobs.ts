import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelJob,
  clearJobs,
  type Job,
  listJobs,
  paste,
  type ResolveReq,
  resolveJob,
} from '@domain'

const ACTIVE: Job['status'][] = [
  'planning',
  'needs_resolution',
  'queued',
  'running',
]

function isActive(jobs: Job[] | undefined): boolean {
  return jobs?.some((j) => ACTIVE.includes(j.status)) ?? false
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: listJobs,
    refetchInterval: (query) => (isActive(query.state.data) ? 750 : false),
  })
}

export function usePaste() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: paste,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useUndoMove() {
  const pasteMut = usePaste()

  return (job: Job) => {
    const i = job.src_path.lastIndexOf('/')
    const name = i === -1 ? job.src_path : job.src_path.slice(i + 1)
    const srcDir = i === -1 ? '' : job.src_path.slice(0, i)
    const dstPath = job.dst_dir ? `${job.dst_dir}/${name}` : name

    pasteMut.mutate({
      op: 'move',
      src_root: job.dst_root,
      src_path: dstPath,
      dst_root: job.src_root,
      dst_dir: srcDir,
    })
  }
}

export function useResolveJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ResolveReq }) =>
      resolveJob(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useClearJobs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clearJobs,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}
