// Mirrors the backend's Entry serialization (snake_case from serde).
export interface Entry {
  name: string
  is_dir: boolean
  size: number
}

export async function fetchRoots(): Promise<string[]> {
  const res = await fetch('/api/roots')
  if (!res.ok) throw new Error(`roots failed: ${res.status}`)
  return res.json()
}

export async function listDir(root: string, path: string): Promise<Entry[]> {
  const params = new URLSearchParams({ root, path })
  const res = await fetch(`/api/list?${params}`)
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  return res.json()
}

// Not a fetch — just builds the URL. Used directly as an <a> href so the browser
// streams/downloads natively (and gets Range support for free).
export function downloadUrl(root: string, path: string, dl = false): string {
  const params = new URLSearchParams({ root, path })
  if (dl) params.set('dl', 'true')
  return `/api/download?${params}`
}
