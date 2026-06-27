export function downloadUrl(root: string, path: string, dl = false): string {
  const params = new URLSearchParams({ root, path })
  if (dl) params.set('dl', 'true')
  return `/api/download?${params}`
}
