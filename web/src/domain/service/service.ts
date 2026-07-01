import { downloadUrl, type Entry, type Root } from '@domain'

const paths = {
  roots: '/api/roots',
  list: '/api/list',
}

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
