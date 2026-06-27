import type { Entry } from '@domain'

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
