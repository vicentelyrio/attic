import type { Dispatch, SetStateAction } from 'react'

import type { TranslationFunctions } from '@i18n'

import type { Job, JobStatus, JobView, ResolveReq } from '@domain'

export const TRANSFERRING: JobStatus[] = ['planning', 'queued', 'running']
export const ACTIVE: JobStatus[] = [...TRANSFERRING, 'needs_resolution']
export const FINISHED: JobStatus[] = ['done', 'failed', 'canceled']

export type View = 'expanded' | 'hidden'

export function basename(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

export function transferTooltip(job: Job): string {
  const name = basename(job.src_path)
  const to = job.dst_dir ? `${job.dst_dir}/${name}` : name

  return job.src_root === job.dst_root
    ? `${job.src_path} → ${to}`
    : `${job.src_root}/${job.src_path} → ${job.dst_root}/${to}`
}

export function percent(job: Job): number {
  if (job.status === 'done') return 100
  if (job.bytes_total <= 0) return 0
  return Math.min(100, (job.bytes_done / job.bytes_total) * 100)
}

export function formatEta(LL: TranslationFunctions, seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60)
    return LL.transfers.etaSeconds({ count: Math.round(seconds) })
  return LL.transfers.etaMinutes({ count: Math.round(seconds / 60) })
}

export type TransfersState = {
  view: View
  setView: Dispatch<SetStateAction<View>>
  toggle: () => void
  list: Job[]
  visible: Job[]
  activeCount: number
  count: number
  busy: boolean
  hasFinished: boolean
  aggPercent: number
  bytesTotal: number
  title: string
  subtitle: string
  sidebarStatus: string
  cancel: (id: string) => void
  cancelAll: () => void
  clear: () => void
  clearPending: boolean
  conflict: JobView | null
  openResolve: (id: string) => void
  applyResolve: (req: ResolveReq) => void
  closeConflict: () => void
}
