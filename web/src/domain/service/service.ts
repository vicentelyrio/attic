import type { Entry, Root } from '@domain'

const paths = {
  roots: '/api/roots',
  list: '/api/list',
}

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
