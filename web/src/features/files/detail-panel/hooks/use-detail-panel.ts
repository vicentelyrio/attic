import { useMemo } from 'react'

import { fileKind } from '@infrastructure'

import { useClipboard } from '@mantine/hooks'

import { downloadUrl, type Entry } from '@domain'

import { buildRows } from '../helpers'
import { useImageDimensions } from './use-image-dimensions'

export function useDetailPanel(entry: Entry, root: string, path: string) {
  const clipboard = useClipboard({ timeout: 1500 })
  const dims = useImageDimensions(entry, root, path)

  const filePath = path ? `${path}/${entry.name}` : entry.name
  const viewUrl = downloadUrl(root, filePath)
  const downloadHref = downloadUrl(root, filePath, true)
  const kind = fileKind(entry.name)

  const rows = useMemo(
    () => buildRows(entry, root, path, dims, kind.label),
    [entry, root, path, dims, kind.label],
  )

  return {
    rows,
    viewUrl,
    downloadHref,
    copied: clipboard.copied,
    share: () => clipboard.copy(`${location.origin}${viewUrl}`),
  }
}
