import {
  downloadUrl,
  type Entry,
  type Job,
  type JobView,
  type Op,
  type Policy,
  type Resolution,
  type Root,
} from '@domain'

const paths = {
  roots: '/api/roots',
  list: '/api/list',
  paste: '/api/paste',
  jobs: '/api/jobs',
  upload: '/api/upload',
}

const jsonHeaders = { 'content-type': 'application/json' }

/** Bytes fetched for a card preview. The backend honours Range requests. */
const PREVIEW_BYTES = 16 * 1024
/** Lines kept after truncation — the card clips the rest anyway. */
const PREVIEW_LINES = 80

export async function fetchRoots(): Promise<Root[]> {
  const res = await fetch(paths.roots)
  if (!res.ok) throw new Error(`roots failed: ${res.status}`)
  return res.json()
}

export async function listDir(root: string, path: string): Promise<Entry[]> {
  const params = new URLSearchParams({ root, path })
  const res = await fetch(`${paths.list}?${params}`)
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  return res.json()
}

/** Fetch the leading slice of a text file for a syntax-highlighted preview. */
export async function fetchTextPreview(
  root: string,
  path: string,
): Promise<string> {
  const res = await fetch(downloadUrl(root, path), {
    headers: { Range: `bytes=0-${PREVIEW_BYTES - 1}` },
  })
  // 206 = partial content (Range honoured), 200 = full (file smaller than range).
  if (!res.ok && res.status !== 206) {
    throw new Error(`preview failed: ${res.status}`)
  }
  const text = await res.text()
  return text.split('\n').slice(0, PREVIEW_LINES).join('\n')
}

export interface PasteReq {
  op: Op
  src_root: string
  src_path: string
  dst_root: string
  dst_dir: string
}

export interface ResolveReq {
  policy?: Policy
  overrides?: Record<string, Resolution>
}

/** Queue a copy/move. The returned job carries `files` with per-file conflict
 *  flags; when `status === 'needs_resolution'` the UI prompts before it runs. */
export async function paste(req: PasteReq): Promise<JobView> {
  const res = await fetch(paths.paste, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`paste failed: ${res.status}`)
  return res.json()
}

export async function listJobs(): Promise<Job[]> {
  const res = await fetch(paths.jobs)
  if (!res.ok) throw new Error(`jobs failed: ${res.status}`)
  return res.json()
}

export async function getJob(id: string): Promise<JobView> {
  const res = await fetch(`${paths.jobs}/${id}`)
  if (!res.ok) throw new Error(`job failed: ${res.status}`)
  return res.json()
}

export async function resolveJob(id: string, req: ResolveReq): Promise<Job> {
  const res = await fetch(`${paths.jobs}/${id}/resolve`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`resolve failed: ${res.status}`)
  return res.json()
}

export async function cancelJob(id: string): Promise<Job> {
  const res = await fetch(`${paths.jobs}/${id}/cancel`, { method: 'POST' })
  if (!res.ok) throw new Error(`cancel failed: ${res.status}`)
  return res.json()
}

export async function clearJobs(): Promise<void> {
  const res = await fetch(paths.jobs, { method: 'DELETE' })
  if (!res.ok) throw new Error(`clear failed: ${res.status}`)
}

export interface UploadReq {
  root: string
  dir: string
  name: string
  file: File
}

export interface UploadOpts {
  onProgress?: (loaded: number) => void
  signal?: AbortSignal
}

/** Stream a single file to the backend. Uses XHR (not fetch) for upload
 *  progress events, and honours an AbortSignal so a queued upload can be
 *  cancelled mid-flight. */
export function uploadFile(
  { root, dir, name, file }: UploadReq,
  { onProgress, signal }: UploadOpts = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ root, dir, name })
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${paths.upload}?${params}`)

    xhr.upload.onprogress = (e) => onProgress?.(e.loaded)
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`upload failed: ${xhr.status}`))
    xhr.onerror = () => reject(new Error('upload failed'))
    xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'))

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(file)
  })
}
