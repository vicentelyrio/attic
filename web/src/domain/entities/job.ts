export type Op = 'copy' | 'move'

export type JobStatus =
  | 'planning'
  | 'needs_resolution'
  | 'queued'
  | 'running'
  | 'done'
  | 'failed'
  | 'canceled'

export type Resolution = 'overwrite' | 'skip'
export type Policy = 'overwrite_all' | 'skip_all'

export interface Job {
  id: string
  op: Op
  src_root: string
  src_path: string
  dst_root: string
  dst_dir: string
  status: JobStatus
  policy: Policy | null
  bytes_total: number
  bytes_done: number
  current_file: string | null
  error: string | null
  created_at: number
  updated_at: number
}

export interface JobFile {
  rel_path: string
  size: number
  bytes_done: number
  conflict: boolean
  resolution: Resolution | null
  done: boolean
}

export interface JobView extends Job {
  files: JobFile[]
}

export interface ClipboardRef {
  root: string
  path: string
}

export type ClipOp = 'copy' | 'cut'

export interface Clipboard {
  op: ClipOp
  items: ClipboardRef[]
}
