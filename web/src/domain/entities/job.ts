/** Server-side operation. A clipboard "cut" maps to a `move`. */
export type Op = 'copy' | 'move'

/** What the user pressed. Kept distinct from the backend `Op`. */
export type ClipOp = 'copy' | 'cut'

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

/** `/api/paste` and `/api/jobs/:id` return the job flattened with its files. */
export interface JobView extends Job {
  files: JobFile[]
}

/** A source reference on the clipboard — metadata only, no file bytes. */
export interface ClipboardRef {
  root: string
  path: string
}

export interface Clipboard {
  op: ClipOp
  items: ClipboardRef[]
}
