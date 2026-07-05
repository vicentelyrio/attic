import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelJob,
  clearJobs,
  listJobs,
  paste,
  resolveJob,
  type ResolveReq,
  type Job,
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
