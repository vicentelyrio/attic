import {
  downloadUrl,
  type Entry,
  type Job,
  type JobView,
  type Op,
  type Policy,
  type Resolution,
  type Root,
  type SearchHit,
} from '@domain'

const paths = {
  roots: '/api/roots',
  list: '/api/list',
  search: '/api/search',
  paste: '/api/paste',
  jobs: '/api/jobs',
  upload: '/api/upload',
  mkdir: '/api/mkdir',
  file: '/api/file',
  delete: '/api/delete',
}

const jsonHeaders = { 'content-type': 'application/json' }

const PREVIEW_BYTES = 16 * 1024
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

export interface SearchOpts {
  root?: string
  limit?: number
}

export async function search(
  q: string,
  { root, limit }: SearchOpts = {},
): Promise<SearchHit[]> {
  const params = new URLSearchParams({ q })
  if (root) params.set('root', root)
  if (limit) params.set('limit', String(limit))
  const res = await fetch(`${paths.search}?${params}`)
  if (!res.ok) throw new Error(`search failed: ${res.status}`)
  return res.json()
}

export async function fetchTextPreview(
  root: string,
  path: string,
): Promise<string> {
  const res = await fetch(downloadUrl(root, path), {
    headers: { Range: `bytes=0-${PREVIEW_BYTES - 1}` },
  })
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

export async function paste(req: PasteReq): Promise<JobView> {
  const res = await fetch(paths.paste, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`paste failed: ${res.status}`)
  return res.json()
}

export interface NewItemReq {
  root: string
  dir: string
  name: string
}

export interface Created {
  name: string
}

async function newItem(url: string, req: NewItemReq): Promise<Created> {
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`create failed: ${res.status}`)
  return res.json()
}

export const createFolder = (req: NewItemReq) => newItem(paths.mkdir, req)

export const createFile = (req: NewItemReq) => newItem(paths.file, req)

export async function trashEntries(
  root: string,
  relPaths: string[],
): Promise<void> {
  const res = await fetch(paths.delete, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ root, paths: relPaths }),
  })
  if (!res.ok) throw new Error(`delete failed: ${res.status}`)
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
