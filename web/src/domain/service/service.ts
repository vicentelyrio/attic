import {
  downloadUrl,
  type Favorite,
  type Job,
  type JobView,
  type Listing,
  type Op,
  type Policy,
  type Resolution,
  type Root,
  type SearchHit,
  type User,
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
  rename: '/api/rename',
  delete: '/api/delete',
  favorites: '/api/favorites',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  register: '/api/auth/register',
  me: '/api/auth/me',
  users: '/api/admin/users',
}

const jsonHeaders = { 'content-type': 'application/json' }

const PREVIEW_BYTES = 16 * 1024
const PREVIEW_LINES = 80

/** A failed API response, carrying the HTTP status so callers (and the global
 *  query error handler) can react to 401s specifically. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/** Single fetch wrapper: same-origin credentials (session cookie) and a typed
 *  error on non-2xx. The one place auth/401 handling is centralized. */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { credentials: 'same-origin', ...init })
  if (!res.ok) {
    // Backend error bodies are short plain-text messages — surface them so forms
    // can show "account is awaiting approval" instead of a bare status code.
    const detail = await res.text().catch(() => '')
    throw new HttpError(
      res.status,
      detail || `${init?.method ?? 'GET'} ${input} → ${res.status}`,
    )
  }
  return res
}

async function getJson<T>(url: string): Promise<T> {
  return (await apiFetch(url)).json()
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: jsonHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return res.status === 204 ? (undefined as T) : res.json()
}

export async function fetchRoots(): Promise<Root[]> {
  return getJson(paths.roots)
}

export async function listDir(root: string, path: string): Promise<Listing> {
  const params = new URLSearchParams({ root, path })
  return getJson(`${paths.list}?${params}`)
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
  return getJson(`${paths.search}?${params}`)
}

export async function fetchTextPreview(
  root: string,
  path: string,
): Promise<string> {
  const res = await apiFetch(downloadUrl(root, path), {
    headers: { Range: `bytes=0-${PREVIEW_BYTES - 1}` },
  })
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
  return postJson(paths.paste, req)
}

export interface NewItemReq {
  root: string
  dir: string
  name: string
}

export interface Created {
  name: string
}

export const createFolder = (req: NewItemReq): Promise<Created> =>
  postJson(paths.mkdir, req)

export const createFile = (req: NewItemReq): Promise<Created> =>
  postJson(paths.file, req)

export interface RenameReq {
  root: string
  /** Path of the entry to rename, relative to the root. */
  path: string
  /** The new (bare) name. */
  name: string
}

export const renameEntry = (req: RenameReq): Promise<Created> =>
  postJson(paths.rename, req)

export async function trashEntries(
  root: string,
  relPaths: string[],
): Promise<void> {
  await postJson(paths.delete, { root, paths: relPaths })
}

export async function fetchFavorites(): Promise<Favorite[]> {
  return getJson(paths.favorites)
}

export interface AddFavoriteReq {
  root: string
  path: string
}

export async function addFavorite(req: AddFavoriteReq): Promise<Favorite> {
  return postJson(paths.favorites, req)
}

export async function removeFavorite(id: string): Promise<void> {
  await apiFetch(`${paths.favorites}/${id}`, { method: 'DELETE' })
}

export async function listJobs(): Promise<Job[]> {
  return getJson(paths.jobs)
}

export async function getJob(id: string): Promise<JobView> {
  return getJson(`${paths.jobs}/${id}`)
}

export async function resolveJob(id: string, req: ResolveReq): Promise<Job> {
  return postJson(`${paths.jobs}/${id}/resolve`, req)
}

export async function cancelJob(id: string): Promise<Job> {
  return postJson(`${paths.jobs}/${id}/cancel`)
}

export async function clearJobs(): Promise<void> {
  await apiFetch(paths.jobs, { method: 'DELETE' })
}

/* ---------------------------------------------------------------- */
/* Auth                                                             */
/* ---------------------------------------------------------------- */

export interface LoginReq {
  username: string
  password: string
  remember: boolean
}

export interface RegisterReq {
  username: string
  password: string
}

export async function login(req: LoginReq): Promise<User> {
  return postJson(paths.login, req)
}

export async function register(req: RegisterReq): Promise<User> {
  return postJson(paths.register, req)
}

export async function logout(): Promise<void> {
  await apiFetch(paths.logout, { method: 'POST' })
}

export async function fetchMe(): Promise<User> {
  return getJson(paths.me)
}

/* ---------------------------------------------------------------- */
/* Admin                                                            */
/* ---------------------------------------------------------------- */

export async function listUsers(status?: string): Promise<User[]> {
  const qs = status ? `?${new URLSearchParams({ status })}` : ''
  return getJson(`${paths.users}${qs}`)
}

export async function approveUser(id: string): Promise<User> {
  return postJson(`${paths.users}/${id}/approve`)
}

export async function disableUser(id: string): Promise<User> {
  return postJson(`${paths.users}/${id}/disable`)
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<void> {
  await postJson(`${paths.users}/${id}/reset-password`, { password })
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`${paths.users}/${id}`, { method: 'DELETE' })
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
        : reject(new HttpError(xhr.status, `upload failed: ${xhr.status}`))
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
